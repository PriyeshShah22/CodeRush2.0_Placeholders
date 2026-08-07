import json
import math
import re
import secrets
from difflib import SequenceMatcher
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from openai import OpenAI
from pydantic import BaseModel
from .config import settings
from .models import *

PII_PATTERNS={
    "phone": re.compile(r"(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "aadhaar_like": re.compile(r"(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)"),
}

def redact_pii(text: str):
    safe=text; detected=[]
    for kind,pattern in PII_PATTERNS.items():
        if pattern.search(safe): detected.append(kind)
        safe=pattern.sub(f"[{kind.upper()} REDACTED]", safe)
    return safe,detected

def reference_number():
    return f"NVR-26-{secrets.randbelow(900000)+100000}"

def audit(db: Session, entity_type: str, entity_id: str, action: str, actor=None, old=None, new=None, reason=None, source="api"):
    db.add(AuditEvent(entity_type=entity_type,entity_id=entity_id,actor_id=getattr(actor,"id",None),actor_role=getattr(getattr(actor,"role",None),"value","system"),action=action,old_value=old,new_value=new,reason=reason,source_component=source))

class ExtractedEntities(BaseModel):
    issue: str|None
    secondary_issue: str|None
    landmark: str|None
    ward: str|None
    safety_impact: str|None
    affected_group: str|None

class TriageOutput(BaseModel):
    language: str
    code_switched: bool
    normalized_translation: str
    translation_hi: str
    translation_mr: str
    category: str
    category_confidence: float
    priority: str
    priority_confidence: float
    resolution_hours: int
    entities: ExtractedEntities
    clarification_questions: list[str]
    explanation: str

CATEGORIES=["roads","water","drainage","sanitation","streetlight","electrical_hazard","trees","flooding","accessibility","public_infrastructure","public_safety","other"]

def openai_triage(complaint: Complaint) -> TriageOutput:
    if not settings.openai_api_key: raise RuntimeError("OpenAI is not configured")
    client=OpenAI(api_key=settings.openai_api_key)
    response=client.responses.parse(
        model=settings.openai_text_model,
        reasoning={"effort":"low"},
        input=[
            {"role":"system","content":"You triage civic service reports for a synthetic Indian municipality. Extract only evidence present. Never decide eligibility, reject a report, or invent a department. Return the same privacy-safe report meaning in three persisted forms: normalized_translation in concise English, translation_hi in natural Hindi written in Devanagari, and translation_mr in natural Marathi written in Devanagari. Hindi and Marathi must not contain English glosses in parentheses or mixed Latin spellings; translate ordinary terms and transliterate place names into Devanagari. Keep only unavoidable official abbreviations such as AI, GPS, SLA, reference codes, and units in Latin script. Preserve measurements, hazards, and reported facts without adding details. Priority must be low, normal, high, or critical. Recommend a realistic resolution_hours between 1 and 720 based on safety impact, scale, and service complexity; this remains subject to human approval and deterministic priority caps. Category must be one of: "+", ".join(CATEGORIES)},
            {"role":"user","content":f"Privacy-safe report: {complaint.safe_text}\nLocation: {complaint.location_text}\nWard hint: {complaint.ward or 'unknown'}"},
        ],
        text_format=TriageOutput,
    )
    if not response.output_parsed: raise RuntimeError("No structured triage returned")
    return response.output_parsed

def transcribe_audio(path: str) -> dict:
    """Translate short Indic-language speech to English with Sarvam Saaras v3."""
    if not settings.sarvam_api_key: raise RuntimeError("Sarvam voice translation is not configured")
    with open(path,"rb") as audio:
        response=httpx.post(
            f"{settings.sarvam_base_url}/speech-to-text",
            headers={"api-subscription-key":settings.sarvam_api_key},
            files={"file":("resident-voice.webm",audio,"audio/webm")},
            data={"model":"saaras:v3","mode":"translate"},
            timeout=45,
        )
    response.raise_for_status()
    payload=response.json()
    return {"text":payload.get("transcript","").strip(),"language":payload.get("language_code") or "auto"}

def geocode_search(query: str) -> list[dict]:
    response=httpx.get(
        f"{settings.geocoder_base_url}/search",
        params={"q":query,"format":"jsonv2","limit":5,"countrycodes":"in","addressdetails":1},
        headers={"User-Agent":"Nivaran local civic prototype/1.0"},timeout=15,
    )
    response.raise_for_status()
    return [{"display_name":row["display_name"],"latitude":float(row["lat"]),"longitude":float(row["lon"])} for row in response.json()]

def reverse_geocode(latitude: float, longitude: float) -> dict:
    response=httpx.get(
        f"{settings.geocoder_base_url}/reverse",
        params={"lat":latitude,"lon":longitude,"format":"jsonv2","zoom":18},
        headers={"User-Agent":"Nivaran local civic prototype/1.0"},timeout=15,
    )
    response.raise_for_status()
    payload=response.json()
    return {"display_name":payload.get("display_name") or f"{latitude:.5f}, {longitude:.5f}","latitude":latitude,"longitude":longitude}

def assistant_response(messages: list[dict], language: str, location_context: dict|None=None) -> tuple[str,dict|None]:
    """Return a concise reply and, only after explicit confirmation, a file_complaint tool call."""
    if not settings.openai_api_key: raise RuntimeError("OpenAI complaint assistant is not configured")
    safe_messages=[]
    for message in messages[-24:]:
        safe,_=redact_pii(str(message.get("text","")))
        safe_messages.append({"role":"assistant" if message.get("from")=="assistant" else "user","content":safe})
    location_note=json.dumps(location_context or {},ensure_ascii=False)
    instructions=(
        "You are Nivaran's complaint filing assistant. Your only capability is gathering enough information "
        "to file one civic complaint. Ask one short relevant question at a time. You need: a clear issue, a "
        "human-verifiable address or landmark, and explicit confirmation to submit. Never handle status, advice, "
        "emergencies, or unrelated requests. Reply in the user's selected language (en, hi, or mr). Do not invent "
        f"facts, locations, wards, departments, or urgency. The selected interface language is {language}. Once the user explicitly confirms the complete summary, "
        "call file_complaint. Location context supplied by the trusted UI is: "+location_note
    )
    response=OpenAI(api_key=settings.openai_api_key).responses.create(
        model=settings.openai_text_model,
        reasoning={"effort":"low"},
        instructions=instructions,
        input=safe_messages,
        tools=[{"type":"function","name":"file_complaint","description":"File the resident's complaint after they explicitly confirm the final summary.","strict":True,"parameters":{"type":"object","properties":{"title":{"type":"string"},"description":{"type":"string"},"location_text":{"type":"string"},"language":{"type":"string","enum":["en","hi","mr","auto"]}},"required":["title","description","location_text","language"],"additionalProperties":False}}],
    )
    for item in response.output:
        if getattr(item,"type",None)=="function_call" and getattr(item,"name",None)=="file_complaint":
            return "",json.loads(item.arguments)
    return (response.output_text or "Please tell me what happened and where it is."),None

def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.openai_api_key: raise RuntimeError("OpenAI embeddings are not configured")
    response=OpenAI(api_key=settings.openai_api_key).embeddings.create(model=settings.openai_embedding_model,input=texts)
    return [item.embedding for item in response.data]

def hybrid_duplicate_score(semantic: float,category_match: bool,ward_match: bool) -> float:
    category=1.0 if category_match else .25
    ward=1.0 if ward_match else .35
    return round(semantic*.65+category*.2+ward*.15,3)

def distance_metres(lat1: float|None,lon1: float|None,lat2: float|None,lon2: float|None) -> float|None:
    if None in {lat1,lon1,lat2,lon2}: return None
    radius=6371000
    phi1,phi2=math.radians(lat1),math.radians(lat2)
    delta_phi=math.radians(lat2-lat1); delta_lambda=math.radians(lon2-lon1)
    a=math.sin(delta_phi/2)**2+math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    return radius*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def deduplicate_complaint(db: Session, complaint: Complaint):
    clusters=db.scalars(select(IncidentCluster).where(IncidentCluster.status=="open")).all()
    complaint_vector=None
    try:
        texts=[complaint.safe_text]+[f"{c.title}. {c.category}. {c.ward}" for c in clusters if c.embedding is None]
        vectors=embed_texts(texts); complaint_vector=vectors[0]; cursor=1
        for cluster in clusters:
            if cluster.embedding is None:
                cluster.embedding=vectors[cursor]; cursor+=1
    except Exception:
        pass
    db.flush()
    best=None
    for cluster in clusters:
        representative=db.scalar(select(Complaint).join(IncidentComplaintLink,IncidentComplaintLink.complaint_id==Complaint.id).where(IncidentComplaintLink.incident_id==cluster.id).order_by(Complaint.created_at.desc()))
        if complaint_vector is not None and cluster.embedding is not None:
            a=complaint_vector; b=list(cluster.embedding)
            dot=sum(x*y for x,y in zip(a,b)); norm_a=sum(x*x for x in a)**.5; norm_b=sum(x*x for x in b)**.5
            semantic=dot/max(norm_a*norm_b,1e-9)
        else:
            semantic=SequenceMatcher(None,complaint.safe_text.casefold(),(representative.safe_text if representative else cluster.title).casefold()).ratio()
        metres=distance_metres(complaint.latitude,complaint.longitude,representative.latitude if representative else None,representative.longitude if representative else None)
        location_match=1.0 if metres is not None and metres<=250 else .85 if representative and complaint.location_text.casefold()==representative.location_text.casefold() else .7 if cluster.ward==complaint.ward else .2
        time_hours=max(0,(complaint.created_at-(representative.created_at if representative else cluster.created_at)).total_seconds()/3600)
        time_score=1.0 if time_hours<=24 else .75 if time_hours<=168 else .4
        category=1.0 if cluster.category==complaint.category else .2
        hybrid=round(semantic*.45+category*.2+location_match*.25+time_score*.1,3)
        if category==1 and location_match==1 and time_hours<=168: hybrid=max(hybrid,.82)
        if best is None or hybrid>best[0]: best=(hybrid,cluster,semantic,category,location_match,metres,time_hours)
    if best and best[0]>=.78:
        hybrid,cluster,semantic,category,location_match,metres,time_hours=best
        db.add(IncidentComplaintLink(incident_id=cluster.id,complaint_id=complaint.id,similarity_score=hybrid,reasons={"semantic_similarity":round(semantic,3),"category_match":category,"location_match":location_match,"distance_metres":round(metres) if metres is not None else None,"time_hours":round(time_hours,1)}))
        cluster.duplicate_count+=1
        if cluster.duplicate_count>=3 and complaint.priority in {Priority.low,Priority.normal}:
            complaint.priority=Priority.high
            complaint.ai_explanation=(complaint.ai_explanation or "")+f" Priority was raised because {cluster.duplicate_count} residents reported the same nearby issue; a reviewer must approve it."
        return cluster,hybrid
    cluster=IncidentCluster(title=(complaint.title or complaint.safe_text[:100]),category=complaint.category or "other",ward=complaint.ward or "Unknown",embedding=complaint_vector)
    db.add(cluster); db.flush(); db.add(IncidentComplaintLink(incident_id=cluster.id,complaint_id=complaint.id,similarity_score=1,reasons={"canonical_report":True}))
    return cluster,1.0

def bounded_resolution_hours(priority: Priority, suggested: int|None, rule_hours: int) -> int:
    maximum={Priority.critical:24,Priority.high:72,Priority.normal:168,Priority.low:336}[priority]
    return max(1,min(suggested or rule_hours,maximum,720))

def utc_aware(value: datetime) -> datetime:
    """SQLite drops timezone metadata; treat persisted civic deadlines as UTC."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

def route_complaint(db: Session, complaint: Complaint, suggested_resolution_hours: int|None=None):
    text=f"{complaint.safe_text} {complaint.normalized_text or ''}".casefold()
    categories={complaint.category or "other"}
    keyword_categories={
        "roads": ("road", "pothole", "रस्ता", "सड़क", "subsidence", "खड्डा"),
        "water": ("water", "pipeline", "पाणी", "पानी", "leak"),
        "electrical_hazard": ("electric", "wire", "shock", "वीज", "बिजली"),
        "public_safety": ("danger", "hazard", "unsafe", "school bus", "खतरा", "धोका"),
    }
    for category,keywords in keyword_categories.items():
        if any(keyword in text for keyword in keywords): categories.add(category)
    rules=db.scalars(select(ServiceRule).where(ServiceRule.category.in_(categories))).all()
    departments={d.id:d for d in db.scalars(select(Department)).all()}
    recs=[]; seen_departments=set()
    for rule in rules:
        jurisdiction=1.0 if rule.ward in ("*",complaint.ward) else 0.25
        dept=departments[rule.department_id]
        workload=db.scalar(select(func.count()).select_from(Assignment).where(Assignment.department_id==dept.id,Assignment.status!="resolved")) or 0
        capacity=max(0.2,1-(workload/max(dept.capacity,1))*0.5)
        service=1.0
        sla=0.85 if complaint.priority in (Priority.high,Priority.critical) else 1.0
        score=round(service*0.45+jurisdiction*0.25+capacity*0.15+sla*0.15,3)
        if dept.id not in seen_departments:
            recs.append((score,rule,dept,{"service_rule":service,"ward_coverage":jurisdiction,"available_capacity":round(capacity,2),"sla_feasibility":sla}))
            seen_departments.add(dept.id)
    recs.sort(key=lambda x:x[0],reverse=True)
    for rank,(score,rule,dept,factors) in enumerate(recs[:4],1):
        db.add(RouteRecommendation(complaint_id=complaint.id,department_id=dept.id,score=score,confidence=score,factors=factors,service_rule_version=rule.version,rank=rank))
    if recs:
        hours=bounded_resolution_hours(complaint.priority,suggested_resolution_hours,recs[0][1].resolution_hours)
        ack=recs[0][1].acknowledgement_hours
        db.add(SLARecord(complaint_id=complaint.id,acknowledgement_due_at=datetime.now(timezone.utc)+timedelta(hours=ack),resolution_due_at=datetime.now(timezone.utc)+timedelta(hours=hours),risk_score=0.15))
    return recs

def process_complaint(db: Session, job: ProcessingJob):
    complaint=db.get(Complaint,job.complaint_id)
    job.status=JobStatus.processing; job.attempts+=1; complaint.status=ComplaintStatus.processing; db.commit()
    try:
        triage=openai_triage(complaint)
        complaint.normalized_text=triage.normalized_translation
        complaint.translation_hi=triage.translation_hi
        complaint.translation_mr=triage.translation_mr
        complaint.language=triage.language
        complaint.category=triage.category if triage.category in CATEGORIES else "other"
        complaint.category_confidence=max(0,min(1,triage.category_confidence))
        complaint.priority=Priority(triage.priority if triage.priority in [p.value for p in Priority] else "normal")
        complaint.priority_confidence=max(0,min(1,triage.priority_confidence))
        complaint.priority_reviewed=False; complaint.routing_approved=False
        complaint.ai_explanation=triage.explanation
        complaint.ai_state="completed"
        db.add(ComplaintAnalysis(complaint_id=complaint.id,entities=triage.entities.model_dump(),clarification_questions=triage.clarification_questions,model_name=settings.openai_text_model))
        cluster,duplicate_score=deduplicate_complaint(db,complaint)
        routes=route_complaint(db,complaint,triage.resolution_hours)
        confidence=min([complaint.category_confidence]+([routes[0][0]] if routes else [0]))
        complaint.status=ComplaintStatus.awaiting_review
        job.status=JobStatus.completed if confidence>=0.65 else JobStatus.manual_review_required
        audit(db,"complaint",complaint.id,"ai_triage_completed",new={"category":complaint.category,"priority":complaint.priority.value,"resolution_hours":triage.resolution_hours,"confidence":confidence},source="worker")
        audit(db,"complaint",complaint.id,"duplicate_evaluated",new={"incident_id":cluster.id,"hybrid_score":duplicate_score},source="worker")
    except Exception as exc:
        lowered=complaint.safe_text.casefold()
        fallback={"roads":("pothole","road","रस्ता","सड़क","खड्डा"),"water":("water","pipeline","leak","पाणी","पानी"),"drainage":("drain","नाला","नाली"),"sanitation":("garbage","waste","कचरा")}
        complaint.category=next((category for category,words in fallback.items() if any(word in lowered for word in words)),complaint.category or "other")
        complaint.ai_state="unavailable"
        complaint.status=ComplaintStatus.awaiting_review
        complaint.ai_explanation="AI processing is unavailable. This report is preserved and requires human review."
        job.status=JobStatus.manual_review_required
        job.error=type(exc).__name__
        cluster,duplicate_score=deduplicate_complaint(db,complaint)
        route_complaint(db,complaint)
        audit(db,"complaint",complaint.id,"ai_triage_degraded",reason="Provider unavailable; manual review required",source="worker")
        audit(db,"complaint",complaint.id,"duplicate_evaluated",new={"incident_id":cluster.id,"hybrid_score":duplicate_score,"mode":"local_fallback"},source="worker")
    complaint.version+=1
    db.commit()

def evaluate_sla(db: Session, simulate_id: str|None=None, actor=None):
    now=datetime.now(timezone.utc)
    query=select(SLARecord).where(SLARecord.breached_at.is_(None))
    for sla in db.scalars(query).all():
        if sla.complaint_id==simulate_id:
            sla.resolution_due_at=now-timedelta(minutes=1); sla.simulated=True
        resolution_due_at=utc_aware(sla.resolution_due_at)
        remaining=(resolution_due_at-now).total_seconds()
        total=max((resolution_due_at-(now-timedelta(hours=24))).total_seconds(),1)
        sla.risk_score=round(min(1,max(0,1-remaining/total)),2)
        if remaining<=0:
            sla.breached_at=now; sla.escalation_level+=1
            c=db.get(Complaint,sla.complaint_id); c.status=ComplaintStatus.escalated; c.version+=1
            audit(db,"complaint",c.id,"sla_breached",actor,new={"level":sla.escalation_level,"simulated":sla.simulated},source="sla_worker")
            identity=db.get(ReporterIdentity,c.reporter_identity_id) if c.reporter_identity_id else None
            db.add(Notification(user_id=identity.user_id if identity else None,complaint_id=c.id,kind="sla_escalation",message="Your service request is delayed and has been escalated for supervisor attention.",locale=c.language if c.language in ("en","hi","mr") else "en"))
            incident=db.scalar(select(IncidentCluster).join(IncidentComplaintLink,IncidentComplaintLink.incident_id==IncidentCluster.id).where(IncidentComplaintLink.complaint_id==c.id))
            if incident:
                supporters=db.scalars(select(IncidentSupport).where(IncidentSupport.incident_id==incident.id,IncidentSupport.subscribed.is_(True))).all()
                for support in supporters:
                    db.add(Notification(user_id=support.user_id,kind="incident_escalated",message=f"Community issue update: {c.location_text} is delayed and has been escalated.",locale="en"))
    db.commit()
