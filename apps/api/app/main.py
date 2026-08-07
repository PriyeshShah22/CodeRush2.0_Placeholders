from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
import secrets
from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.orm import Session, joinedload
from .config import settings
from .db import get_db
from .models import *
from .schemas import *
from .security import *
from .services import assistant_response, audit, evaluate_sla, geocode_search, redact_pii, reference_number, reverse_geocode, route_complaint, transcribe_audio

limiter=Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.upload_dir).mkdir(parents=True,exist_ok=True)
    if settings.database_url.startswith("sqlite"):
        from .db import Base,engine
        from .seed import run as seed_database
        Base.metadata.create_all(engine)
        with engine.begin() as connection:
            columns={row[1] for row in connection.exec_driver_sql("PRAGMA table_info(complaints)")}
            if "priority_reviewed" not in columns: connection.exec_driver_sql("ALTER TABLE complaints ADD COLUMN priority_reviewed BOOLEAN NOT NULL DEFAULT 0")
            if "routing_approved" not in columns: connection.exec_driver_sql("ALTER TABLE complaints ADD COLUMN routing_approved BOOLEAN NOT NULL DEFAULT 0")
            if "translation_hi" not in columns: connection.exec_driver_sql("ALTER TABLE complaints ADD COLUMN translation_hi TEXT")
            if "translation_mr" not in columns: connection.exec_driver_sql("ALTER TABLE complaints ADD COLUMN translation_mr TEXT")
            sla_columns={row[1] for row in connection.exec_driver_sql("PRAGMA table_info(sla_records)")}
            if "review_due_at" not in sla_columns: connection.exec_driver_sql("ALTER TABLE sla_records ADD COLUMN review_due_at DATETIME")
            if "review_breached_at" not in sla_columns: connection.exec_driver_sql("ALTER TABLE sla_records ADD COLUMN review_breached_at DATETIME")
            if "department_breached_at" not in sla_columns: connection.exec_driver_sql("ALTER TABLE sla_records ADD COLUMN department_breached_at DATETIME")
            connection.exec_driver_sql("UPDATE sla_records SET review_due_at=acknowledgement_due_at WHERE review_due_at IS NULL")
        seed_database()
    yield

app=FastAPI(title="Nivaran Civic Operations API",version="1.0.0",lifespan=lifespan)
app.state.limiter=limiter
app.add_exception_handler(RateLimitExceeded,_rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware,allow_origins=[settings.web_origin],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response=await call_next(request)
    response.headers["X-Content-Type-Options"]="nosniff"
    response.headers["X-Frame-Options"]="DENY"
    response.headers["Referrer-Policy"]="same-origin"
    response.headers["Permissions-Policy"]="camera=(), geolocation=(self), microphone=(self)"
    return response

@app.get("/health")
def health(): return {"status":"ok","service":"nivaran-api"}

@app.get("/ready")
def ready(db: Session=Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status":"ready","database":"connected"}

@app.post("/api/auth/login")
@limiter.limit("8/minute")
def login(request: Request, body: LoginRequest, response: Response, db: Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==body.email.lower()))
    if not user or not verify_password(body.password,user.password_hash): raise HTTPException(401,"Invalid email or password")
    response.set_cookie("nivaran_access",create_token(user,"access",15),httponly=True,secure=settings.cookie_secure,samesite="lax",max_age=900)
    response.set_cookie("nivaran_refresh",create_token(user,"refresh",60*24*7),httponly=True,secure=settings.cookie_secure,samesite="lax",max_age=604800)
    audit(db,"user",user.id,"login",user); db.commit()
    return {"data":UserOut.model_validate(user)}

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("nivaran_access"); response.delete_cookie("nivaran_refresh")
    return {"message":"Signed out"}

@app.get("/api/auth/me")
def me(user: User=Depends(current_user)): return {"data":UserOut.model_validate(user)}

@app.post("/api/auth/refresh")
def refresh(request: Request,response: Response,db: Session=Depends(get_db)):
    token=request.cookies.get("nivaran_refresh")
    try:
        payload=jwt.decode(token,settings.jwt_secret,algorithms=["HS256"])
        if payload.get("kind")!="refresh": raise ValueError()
    except Exception: raise HTTPException(401,"Refresh session expired")
    user=db.get(User,payload["sub"])
    if not user or not user.is_active: raise HTTPException(401,"Account unavailable")
    response.set_cookie("nivaran_access",create_token(user,"access",15),httponly=True,secure=settings.cookie_secure,samesite="lax",max_age=900)
    response.set_cookie("nivaran_refresh",create_token(user,"refresh",60*24*7),httponly=True,secure=settings.cookie_secure,samesite="lax",max_age=604800)
    return {"data":UserOut.model_validate(user)}

def persist_complaint(db: Session,body: ComplaintCreate,idempotency_key: str,user: User|None):
    existing=db.scalar(select(AuditEvent).where(AuditEvent.action=="complaint_created",AuditEvent.reason==idempotency_key))
    if existing:
        c=db.get(Complaint,existing.entity_id); return {"data":{"complaint":ComplaintOut.model_validate(c),"tracking_pin":pin_for_idempotency(idempotency_key)},"message":"Existing submission returned"}
    safe,pii=redact_pii(body.description); pin=pin_for_idempotency(idempotency_key)
    identity=ReporterIdentity(user_id=user.id if user else None,display_name=body.reporter_name,phone=body.reporter_phone,email=body.reporter_email)
    db.add(identity); db.flush()
    c=Complaint(reference_number=reference_number(),tracking_pin_hash=hash_pin(pin),reporter_identity_id=identity.id,original_text=body.description,safe_text=safe,title=body.title,language=body.language,source_channel=body.source_channel,priority=Priority.normal,location_text=body.location_text,ward=body.ward,latitude=body.latitude,longitude=body.longitude,pii_detected=pii)
    db.add(c); db.flush()
    db.add(ConsentRecord(complaint_id=c.id,consent_type="voice_processing",granted=body.voice_processing_consent))
    db.add(ProcessingJob(complaint_id=c.id))
    audit(db,"complaint",c.id,"complaint_created",new={"source":body.source_channel,"pii_types":pii},reason=idempotency_key)
    db.commit(); db.refresh(c)
    return {"data":{"complaint":ComplaintOut.model_validate(c),"tracking_pin":pin},"message":"Your report is saved and queued for review."}

@app.post("/api/complaints",response_model=dict)
@limiter.limit("10/hour")
def create_complaint(request: Request,body: ComplaintCreate,idempotency_key: str=Header(min_length=8),db: Session=Depends(get_db),user: User|None=Depends(optional_current_user)):
    return persist_complaint(db,body,idempotency_key,user)

@app.post("/api/complaints/track")
@limiter.limit("20/hour")
def track(request: Request,body: TrackRequest,user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    c=db.scalar(select(Complaint).where(Complaint.reference_number==body.reference_number.upper()))
    identity=db.get(ReporterIdentity,c.reporter_identity_id) if c else None
    if not c or not identity or identity.user_id!=user.id: raise HTTPException(404,"Complaint not found in your account")
    if not verify_pin(body.tracking_pin,c.tracking_pin_hash): raise HTTPException(403,"Tracking PIN is incorrect")
    timeline=db.scalars(select(AuditEvent).where(AuditEvent.entity_id==c.id).order_by(AuditEvent.created_at)).all()
    sla=db.scalar(select(SLARecord).where(SLARecord.complaint_id==c.id))
    return {"data":{"complaint":ComplaintOut.model_validate(c),"sla":sla,"timeline":[{"action":e.action,"reason":e.reason,"created_at":e.created_at} for e in timeline]}}

@app.get("/api/complaints")
def resident_complaints(user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    rows=db.scalars(select(Complaint).join(ReporterIdentity).where(ReporterIdentity.user_id==user.id).order_by(Complaint.created_at.desc())).all()
    links={link.complaint_id:link.incident_id for link in db.scalars(select(IncidentComplaintLink)).all()}
    clusters={cluster.id:cluster for cluster in db.scalars(select(IncidentCluster)).all()}
    seen=set(); grouped=[]
    for complaint in rows:
        incident_id=links.get(complaint.id)
        if incident_id and incident_id in seen: continue
        if incident_id: seen.add(incident_id)
        count=clusters[incident_id].duplicate_count if incident_id in clusters else 1
        grouped.append(ComplaintOut.model_validate(complaint).model_copy(update={"linked_reports":count}))
    return {"data":grouped}

@app.get("/api/complaints/{complaint_id}")
def complaint_detail(complaint_id: str,user: User=Depends(current_user),db: Session=Depends(get_db)):
    c=db.scalar(select(Complaint).options(joinedload(Complaint.analysis)).where(Complaint.id==complaint_id))
    if not c: raise HTTPException(404,"Complaint not found")
    if user.role==Role.resident:
        identity=db.get(ReporterIdentity,c.reporter_identity_id)
        if not identity or identity.user_id!=user.id: raise HTTPException(403,"Not your complaint")
    routes=db.execute(select(RouteRecommendation,Department).join(Department).where(RouteRecommendation.complaint_id==c.id).order_by(RouteRecommendation.rank)).all()
    sla=db.scalar(select(SLARecord).where(SLARecord.complaint_id==c.id))
    events=db.scalars(select(AuditEvent).where(AuditEvent.entity_id==c.id).order_by(AuditEvent.created_at.desc())).all()
    incident_row=db.execute(select(IncidentComplaintLink,IncidentCluster).join(IncidentCluster,IncidentCluster.id==IncidentComplaintLink.incident_id).where(IncidentComplaintLink.complaint_id==c.id)).first()
    incident={"id":incident_row[1].id,"title":incident_row[1].title,"linked_reports":incident_row[1].duplicate_count,"match_score":incident_row[0].similarity_score,"match_reasons":incident_row[0].reasons,"clubbed":not bool(incident_row[0].reasons.get("canonical_report"))} if incident_row else None
    public_reasons={"resident_review_requested","sla_breached"}
    timeline=[{"id":event.id,"action":event.action,"created_at":event.created_at,"reason":event.reason if event.action in public_reasons else None} for event in events]
    return {"data":{"complaint":ComplaintOut.model_validate(c),"analysis":c.analysis,"routes":[{"id":r.id,"department_id":d.id,"department":d.name,"factors":r.factors,"rank":r.rank} for r,d in routes],"incident":incident,"sla":sla,"timeline":timeline}}

@app.post("/api/complaints/{complaint_id}/appeals")
def appeal(complaint_id: str,body: AppealRequest,user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id); identity=db.get(ReporterIdentity,c.reporter_identity_id) if c else None
    if not c or not identity or identity.user_id!=user.id: raise HTTPException(404,"Complaint not found")
    db.add(Appeal(complaint_id=c.id,kind=body.kind,message=body.message)); c.status=ComplaintStatus.reopened; c.version+=1
    audit(db,"complaint",c.id,"resident_review_requested",user,reason=body.message); db.commit()
    return {"message":"Your request for human review has been recorded."}

@app.get("/api/reviewer/queue")
def reviewer_queue(user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db),status: str|None=None,ward: str|None=None):
    q=select(Complaint).order_by(Complaint.priority.desc(),Complaint.created_at)
    if status: q=q.where(Complaint.status==status)
    if ward: q=q.where(Complaint.ward==ward)
    rows=db.scalars(q).all(); slas={s.complaint_id:s for s in db.scalars(select(SLARecord)).all()}
    return {"data":[{**ComplaintOut.model_validate(c).model_dump(),"sla":slas.get(c.id)} for c in rows]}

@app.post("/api/reviewer/complaints/{complaint_id}/override")
def override(complaint_id: str,body: OverrideRequest,user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if c.version!=body.expected_version: raise HTTPException(409,"This complaint changed; refresh before overriding")
    allowed={"category","priority","ward"}
    if body.field not in allowed: raise HTTPException(422,"Unsupported override field")
    old=getattr(c,body.field); old_value=old.value if hasattr(old,"value") else old
    setattr(c,body.field,Priority(body.new_value) if body.field=="priority" else body.new_value); c.version+=1
    if body.field=="priority": c.priority_reviewed=True
    db.add(HumanOverride(complaint_id=c.id,field=body.field,previous_value=str(old_value),new_value=body.new_value,reason_code=body.reason_code,note=body.note,actor_id=user.id))
    audit(db,"complaint",c.id,"human_override",user,{body.field:old_value},{body.field:body.new_value},f"{body.reason_code}: {body.note or ''}")
    db.commit(); return {"data":ComplaintOut.model_validate(c),"message":"Override recorded with its reason."}

@app.post("/api/reviewer/complaints/{complaint_id}/decision")
def reviewer_decision(complaint_id: str,body: ReviewerDecisionRequest,user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if c.version!=body.expected_version: raise HTTPException(409,"This complaint changed; refresh before reviewing")
    configured_categories=set(db.scalars(select(ServiceRule.category)).all())|{"other"}
    if body.category not in configured_categories: raise HTTPException(422,"Category is not covered by a configured service rule")
    changes={}
    for field,new_value in {"category":body.category,"priority":body.priority}.items():
        old=getattr(c,field); old_value=old.value if hasattr(old,"value") else old
        next_value=new_value.value if hasattr(new_value,"value") else new_value
        if old_value!=next_value: changes[field]=(old_value,next_value)
    for field,(old_value,next_value) in changes.items():
        setattr(c,field,Priority(next_value) if field=="priority" else next_value)
        db.add(HumanOverride(complaint_id=c.id,field=field,previous_value=str(old_value),new_value=str(next_value),reason_code=body.reason_code or "reviewer_adjustment",note=body.note,actor_id=user.id))
    current_sla=db.scalar(select(SLARecord).where(SLARecord.complaint_id==c.id))
    current_due=current_sla.resolution_due_at.replace(tzinfo=timezone.utc) if current_sla and current_sla.resolution_due_at.tzinfo is None else current_sla.resolution_due_at if current_sla else None
    old_hours=max(1,round((current_due-datetime.now(timezone.utc)).total_seconds()/3600)) if current_due else None
    if old_hours!=body.resolution_hours:
        db.add(HumanOverride(complaint_id=c.id,field="resolution_hours",previous_value=str(old_hours or "unset"),new_value=str(body.resolution_hours),reason_code="reviewer_adjustment",note=body.note,actor_id=user.id))
        changes["resolution_hours"]=(old_hours,body.resolution_hours)
    if "category" in changes:
        db.execute(delete(RouteRecommendation).where(RouteRecommendation.complaint_id==c.id))
        db.execute(delete(SLARecord).where(SLARecord.complaint_id==c.id))
        route_complaint(db,c,body.resolution_hours)
    elif current_sla:
        current_sla.resolution_due_at=datetime.now(timezone.utc)+timedelta(hours=body.resolution_hours)
        current_sla.risk_score=0.15
    else:
        route_complaint(db,c,body.resolution_hours)
    c.priority_reviewed=True; c.routing_approved=True; c.version+=1
    audit(db,"complaint",c.id,"reviewer_decision_approved",user,old={field:old for field,(old,_) in changes.items()},new={"changes":{field:new for field,(_,new) in changes.items()},"priority_reviewed":True,"routing_approved":True},reason=body.note)
    db.commit(); db.refresh(c)
    return {"data":ComplaintOut.model_validate(c),"message":"Priority and route are approved for assignment."}

@app.post("/api/reviewer/complaints/{complaint_id}/reject")
def reviewer_reject(complaint_id: str,body: ReviewerRejectionRequest,user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if c.version!=body.expected_version: raise HTTPException(409,"This complaint changed; refresh before reviewing")
    if c.status not in {ComplaintStatus.awaiting_review,ComplaintStatus.reopened}: raise HTTPException(422,"Only complaints awaiting review can be rejected")
    c.status=ComplaintStatus.rejected; c.version+=1
    audit(db,"complaint",c.id,"reviewer_rejected",user,new={"status":"rejected"},reason=body.reason)
    identity=db.get(ReporterIdentity,c.reporter_identity_id) if c.reporter_identity_id else None
    if identity and identity.user_id:
        db.add(Notification(user_id=identity.user_id,complaint_id=c.id,kind="complaint_rejected",message="Your report could not be accepted for municipal action. You may request a correction with more details.",locale=c.language if c.language in ("en","hi","mr") else "en"))
    db.commit(); return {"message":"Complaint rejected and the resident was notified."}

@app.post("/api/reviewer/complaints/{complaint_id}/assign")
def assign(complaint_id: str,body: AssignRequest,user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if c.version!=body.expected_version: raise HTTPException(409,"This complaint changed; refresh before assigning")
    if not c.priority_reviewed or not c.routing_approved: raise HTTPException(409,"Human review and priority approval are required before assignment")
    if c.status not in {ComplaintStatus.awaiting_review,ComplaintStatus.reopened}: raise HTTPException(422,f"A complaint in {c.status.value} state cannot be assigned")
    if not db.get(Department,body.primary_department_id): raise HTTPException(422,"Unknown primary department")
    recommended=db.scalar(select(RouteRecommendation).where(RouteRecommendation.complaint_id==c.id).order_by(RouteRecommendation.rank))
    if recommended and recommended.department_id!=body.primary_department_id:
        if not body.reason_code: raise HTTPException(422,"A reason is required when overriding the recommended department")
        db.add(HumanOverride(complaint_id=c.id,field="department",previous_value=recommended.department_id,new_value=body.primary_department_id,reason_code=body.reason_code,note=body.note,actor_id=user.id))
        audit(db,"complaint",c.id,"department_override",user,old={"department_id":recommended.department_id},new={"department_id":body.primary_department_id},reason=f"{body.reason_code}: {body.note or ''}")
    primary=Assignment(complaint_id=c.id,department_id=body.primary_department_id,kind="primary"); db.add(primary); db.flush()
    supporting=list(dict.fromkeys([department_id for department_id in [body.supporting_department_id,*body.supporting_department_ids] if department_id and department_id!=body.primary_department_id]))
    for department_id in supporting:
        if not db.get(Department,department_id): raise HTTPException(422,"Unknown supporting department")
        support=Assignment(complaint_id=c.id,department_id=department_id,kind="supporting"); db.add(support); db.flush(); db.add(TaskDependency(parent_assignment_id=primary.id,depends_on_assignment_id=support.id))
    c.status=ComplaintStatus.assigned; c.version+=1
    audit(db,"complaint",c.id,"departments_assigned",user,new={"primary":body.primary_department_id,"supporting":supporting})
    db.commit(); return {"message":"Departments assigned and resident timeline updated."}

@app.get("/api/department/tasks")
def department_tasks(user: User=Depends(require_roles(Role.department,Role.admin)),db: Session=Depends(get_db)):
    q=select(Assignment,Complaint).join(Complaint).order_by(Assignment.assigned_at.desc())
    if user.role==Role.department: q=q.where(Assignment.department_id==user.department_id)
    rows=db.execute(q).all(); slas={sla.complaint_id:sla for sla in db.scalars(select(SLARecord)).all()}
    return {"data":[{"assignment":a,"complaint":ComplaintOut.model_validate(c),"sla":slas.get(c.id)} for a,c in rows]}

@app.get("/api/department/tasks/{assignment_id}")
def department_task(assignment_id: str,user: User=Depends(require_roles(Role.department,Role.admin)),db: Session=Depends(get_db)):
    assignment=db.get(Assignment,assignment_id)
    if not assignment: raise HTTPException(404,"Task not found")
    if user.role==Role.department and assignment.department_id!=user.department_id: raise HTTPException(403,"Task belongs to another department")
    complaint=db.get(Complaint,assignment.complaint_id)
    dependencies=db.scalars(select(TaskDependency).where(or_(TaskDependency.parent_assignment_id==assignment.id,TaskDependency.depends_on_assignment_id==assignment.id))).all()
    sla=db.scalar(select(SLARecord).where(SLARecord.complaint_id==complaint.id))
    return {"data":{"assignment":assignment,"complaint":ComplaintOut.model_validate(complaint),"dependencies":dependencies,"sla":sla}}

@app.post("/api/department/tasks/{assignment_id}/status")
def task_status(assignment_id: str,body: StatusRequest,user: User=Depends(require_roles(Role.department,Role.admin)),db: Session=Depends(get_db)):
    a=db.get(Assignment,assignment_id); c=db.get(Complaint,a.complaint_id) if a else None
    if not a or not c: raise HTTPException(404,"Task not found")
    if user.role==Role.department and a.department_id!=user.department_id: raise HTTPException(403,"Task belongs to another department")
    if c.version!=body.expected_version: raise HTTPException(409,"Task changed; refresh first")
    allowed={"assigned":{"acknowledged"},"acknowledged":{"in_progress"},"in_progress":{"resolved"}}
    if body.status not in allowed.get(a.status,set()): raise HTTPException(422,f"Cannot move a task from {a.status} to {body.status}")
    a.status=body.status
    if body.status=="acknowledged": a.acknowledged_at=datetime.now(timezone.utc); c.status=ComplaintStatus.acknowledged
    elif body.status=="in_progress": c.status=ComplaintStatus.in_progress
    else: a.resolved_at=datetime.now(timezone.utc); c.status=ComplaintStatus.resolved
    c.version+=1; audit(db,"complaint",c.id,f"department_{body.status}",user,reason=body.note)
    identity=db.get(ReporterIdentity,c.reporter_identity_id) if c.reporter_identity_id else None
    if identity and identity.user_id:
        db.add(Notification(user_id=identity.user_id,complaint_id=c.id,kind="complaint_status_update",message=f"Your complaint {c.reference_number} is now {body.status.replace('_',' ')}.",locale=c.language if c.language in ("en","hi","mr") else "en"))
    db.commit()
    return {"message":"Task status and resident timeline updated."}

@app.post("/api/admin/escalations/{complaint_id}/simulate")
def simulate_breach(complaint_id: str,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    evaluate_sla(db,complaint_id,user,"review" if c.status in {ComplaintStatus.awaiting_review,ComplaintStatus.reopened} else "department")
    return {"message":"Controlled SLA breach processed through the live escalation workflow."}

@app.post("/api/complaints/{complaint_id}/sla/simulate")
def simulate_role_sla_breach(complaint_id: str,body: SLASimulationRequest,user: User=Depends(require_roles(Role.reviewer,Role.department,Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if body.stage=="review" and user.role==Role.department: raise HTTPException(403,"Department users cannot simulate review SLAs")
    if body.stage=="department":
        assignment=db.scalar(select(Assignment).where(Assignment.complaint_id==c.id,Assignment.department_id==user.department_id)) if user.role==Role.department else True
        if not assignment: raise HTTPException(403,"This task does not belong to your department")
    evaluate_sla(db,complaint_id,user,body.stage)
    return {"message":f"{body.stage.title()} SLA breach simulated and escalated to Admin."}

@app.get("/api/admin/dashboard")
def dashboard(user: User=Depends(require_roles(Role.admin,Role.reviewer)),db: Session=Depends(get_db)):
    complaints=db.scalars(select(Complaint).order_by(Complaint.created_at)).all()
    links={link.complaint_id:link.incident_id for link in db.scalars(select(IncidentComplaintLink)).all()}
    clusters={cluster.id:cluster for cluster in db.scalars(select(IncidentCluster)).all()}
    incidents={}
    for complaint in complaints:
        key=links.get(complaint.id) or complaint.id
        incidents.setdefault(key,complaint)
        if complaint.updated_at>incidents[key].updated_at: incidents[key]=complaint
    representatives=list(incidents.values())
    open_count=sum(1 for complaint in representatives if complaint.status!=ComplaintStatus.resolved)
    resolved=sum(1 for complaint in representatives if complaint.status==ComplaintStatus.resolved)
    breached=db.scalar(select(func.count()).select_from(SLARecord).where(SLARecord.breached_at.is_not(None))) or 0
    total_sla=db.scalar(select(func.count()).select_from(SLARecord)) or 0
    category_counts={}; ward_counts={}; status_counts={}
    for complaint in representatives:
        category_counts[complaint.category or "Unclassified"]=category_counts.get(complaint.category or "Unclassified",0)+1
        ward_counts[complaint.ward or "Unknown"]=ward_counts.get(complaint.ward or "Unknown",0)+1
        status_counts[complaint.status.value]=status_counts.get(complaint.status.value,0)+1
    map_points=[]
    for key,complaint in incidents.items():
        if complaint.latitude is None or complaint.longitude is None: continue
        cluster=clusters.get(key)
        map_points.append({"id":key,"label":complaint.location_text,"latitude":complaint.latitude,"longitude":complaint.longitude,"count":cluster.duplicate_count if cluster else 1,"category":complaint.category or "other","status":complaint.status.value})
    now=datetime.now(timezone.utc)
    deadline_rows=db.execute(select(SLARecord,Complaint).join(Complaint).where(Complaint.status!=ComplaintStatus.resolved).order_by(SLARecord.resolution_due_at).limit(8)).all()
    deadlines=[]
    for sla,complaint in deadline_rows:
        incident_key=links.get(complaint.id) or complaint.id
        if incidents.get(incident_key).id!=complaint.id: continue
        due=sla.resolution_due_at.replace(tzinfo=timezone.utc) if sla.resolution_due_at.tzinfo is None else sla.resolution_due_at
        deadlines.append({"complaint_id":complaint.id,"reference_number":complaint.reference_number,"title":complaint.title or complaint.normalized_text or complaint.safe_text,"priority":complaint.priority.value,"status":complaint.status.value,"resolution_due_at":due,"remaining_hours":round((due-now).total_seconds()/3600,1)})
    return {"data":{"open_complaints":open_count,"resolved_complaints":resolved,"active_breaches":breached,"sla_compliance":round((1-breached/max(total_sla,1))*100,1),"categories":[{"name":k,"value":v} for k,v in category_counts.items()],"wards":[{"name":k,"value":v} for k,v in ward_counts.items()],"statuses":[{"name":k,"value":v} for k,v in status_counts.items()],"map_points":map_points,"deadlines":deadlines}}

@app.get("/api/admin/analytics")
def analytics(user: User=Depends(require_roles(Role.admin,Role.reviewer)),db: Session=Depends(get_db)):
    return dashboard(user,db)

@app.get("/api/admin/escalations")
def escalations(user: User=Depends(require_roles(Role.admin,Role.reviewer)),db: Session=Depends(get_db)):
    rows=db.execute(select(SLARecord,Complaint).join(Complaint).where(or_(SLARecord.breached_at.is_not(None),SLARecord.risk_score>=.6)).order_by(SLARecord.risk_score.desc())).all()
    actions={}
    for event in db.scalars(select(AuditEvent).where(AuditEvent.action=="admin_breach_action").order_by(AuditEvent.created_at.desc())).all():
        actions.setdefault(event.entity_id,event)
    return {"data":[{"complaint":ComplaintOut.model_validate(c),"sla":sla,"admin_action":({"action":actions[c.id].new_value.get("action"),"note":actions[c.id].reason,"created_at":actions[c.id].created_at} if c.id in actions else None)} for sla,c in rows]}

@app.post("/api/admin/escalations/{complaint_id}/action")
def admin_breach_action(complaint_id: str,body: AdminEscalationActionRequest,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id); sla=db.scalar(select(SLARecord).where(SLARecord.complaint_id==complaint_id))
    if not c or not sla or not sla.breached_at: raise HTTPException(404,"An active SLA breach was not found")
    assignments=db.scalars(select(Assignment).where(Assignment.complaint_id==c.id)).all()
    department_ids={item.department_id for item in assignments}
    recipients=db.scalars(select(User).where(User.department_id.in_(department_ids))).all() if department_ids else []
    if body.action=="request_update":
        for recipient in recipients:
            db.add(Notification(user_id=recipient.id,complaint_id=c.id,kind="admin_update_requested",message=f"Admin requested an immediate breach update for {c.reference_number}.",locale="en"))
        result="Update request sent to the responsible department."
    else:
        sla.resolution_due_at=datetime.now(timezone.utc)+timedelta(hours=body.recovery_hours)
        for recipient in recipients:
            db.add(Notification(user_id=recipient.id,complaint_id=c.id,kind="admin_recovery_target",message=f"Admin set a {body.recovery_hours}-hour urgent recovery target for {c.reference_number}.",locale="en"))
        result=f"A {body.recovery_hours}-hour recovery target was set."
    audit(db,"complaint",c.id,"admin_breach_action",user,new={"action":body.action,"recovery_hours":body.recovery_hours},reason=body.note or result,source="admin_escalation")
    db.add(Notification(user_id=user.id,complaint_id=c.id,kind="admin_breach_action",message=result,locale="en"))
    db.commit(); return {"message":result}

@app.get("/api/admin/departments")
def list_departments(user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    return {"data":db.scalars(select(Department).order_by(Department.name)).all()}

@app.post("/api/admin/departments")
def create_department(body: DepartmentUpsert,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    if db.scalar(select(Department).where(Department.code==body.code)): raise HTTPException(409,"Department code already exists")
    department=Department(**body.model_dump()); db.add(department); db.flush()
    audit(db,"department",department.id,"department_created",user,new=body.model_dump()); db.commit(); db.refresh(department)
    return {"data":department}

@app.patch("/api/admin/departments/{department_id}")
def update_department(department_id: str,body: DepartmentUpsert,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    department=db.get(Department,department_id)
    if not department: raise HTTPException(404,"Department not found")
    old={"code":department.code,"name":department.name,"service_types":department.service_types,"capacity":department.capacity,"active":department.active}
    for field,value in body.model_dump().items(): setattr(department,field,value)
    audit(db,"department",department.id,"department_updated",user,old,body.model_dump()); db.commit(); db.refresh(department)
    return {"data":department}

@app.get("/api/admin/service-rules")
def list_service_rules(user: User=Depends(require_roles(Role.admin,Role.reviewer)),db: Session=Depends(get_db)):
    rows=db.execute(select(ServiceRule,Department).join(Department).order_by(ServiceRule.category,ServiceRule.ward)).all()
    return {"data":[{"rule":rule,"department":department} for rule,department in rows]}

@app.post("/api/admin/service-rules")
def create_service_rule(body: ServiceRuleUpsert,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    if not db.get(Department,body.department_id): raise HTTPException(422,"Unknown department")
    rule=ServiceRule(**body.model_dump()); db.add(rule); db.flush()
    audit(db,"service_rule",rule.id,"service_rule_created",user,new=body.model_dump()); db.commit(); db.refresh(rule)
    return {"data":rule}

@app.patch("/api/admin/service-rules/{rule_id}")
def update_service_rule(rule_id: str,body: ServiceRuleUpsert,user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    rule=db.get(ServiceRule,rule_id)
    if not rule: raise HTTPException(404,"Service rule not found")
    if not db.get(Department,body.department_id): raise HTTPException(422,"Unknown department")
    old={key:getattr(rule,key) for key in body.model_fields}
    for field,value in body.model_dump().items(): setattr(rule,field,value)
    audit(db,"service_rule",rule.id,"service_rule_updated",user,old,body.model_dump()); db.commit(); db.refresh(rule)
    return {"data":rule}

@app.get("/api/admin/audit")
def audit_log(user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    return {"data":db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(200)).all()}

@app.get("/api/admin/evaluation")
def evaluation(user: User=Depends(require_roles(Role.admin)),db: Session=Depends(get_db)):
    total=db.scalar(select(func.count()).select_from(EvaluationItem)) or 0
    by_language=db.execute(select(EvaluationItem.language,func.count()).group_by(EvaluationItem.language)).all()
    run=db.scalar(select(EvaluationRun).order_by(EvaluationRun.created_at.desc()))
    metrics=run.metrics if run else {"baseline_route_accuracy":0,"assisted_route_accuracy":0,"baseline_seconds":0,"assisted_seconds":0}
    return {"data":{"dataset_size":total,"status":"ready" if run else "not_run","metrics_note":"Metrics are calculated from labeled synthetic evaluation records; no adoption claims are made.","language_coverage":[{"language":k,"items":v} for k,v in by_language],"baseline":{"route_accuracy":metrics["baseline_route_accuracy"],"median_triage_seconds":metrics["baseline_seconds"]},"assisted":{"route_accuracy":metrics["assisted_route_accuracy"],"median_triage_seconds":metrics["assisted_seconds"]}}}

@app.get("/api/notifications")
def notifications(user: User=Depends(current_user),db: Session=Depends(get_db)):
    return {"data":db.scalars(select(Notification).where(or_(Notification.user_id==user.id,Notification.user_id.is_(None))).order_by(Notification.created_at.desc())).all()}

@app.post("/api/notifications/{notification_id}/read")
def read_notification(notification_id: str,user: User=Depends(current_user),db: Session=Depends(get_db)):
    item=db.get(Notification,notification_id)
    if not item or item.user_id not in {None,user.id}: raise HTTPException(404,"Notification not found")
    item.read=True; db.commit(); return {"message":"Notification marked as read."}

@app.get("/api/locations/search")
@limiter.limit("30/minute")
def search_locations(request: Request,q: str,user: User=Depends(require_roles(Role.resident,Role.reviewer)),db: Session=Depends(get_db)):
    if len(q.strip())<3: return {"data":[]}
    try: return {"data":geocode_search(q.strip())}
    except Exception: raise HTTPException(503,"Address search is temporarily unavailable")

@app.get("/api/locations/reverse")
@limiter.limit("30/minute")
def location_reverse(request: Request,latitude: float,longitude: float,user: User=Depends(require_roles(Role.resident,Role.reviewer)),db: Session=Depends(get_db)):
    if not -90<=latitude<=90 or not -180<=longitude<=180: raise HTTPException(422,"Invalid coordinates")
    try: return {"data":reverse_geocode(latitude,longitude)}
    except Exception: raise HTTPException(503,"Address lookup is temporarily unavailable")

@app.post("/api/assistant/messages")
@limiter.limit("30/minute")
def assistant_message(request: Request,body: AssistantMessage,user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    session=db.get(AssistantSession,body.session_id) if body.session_id else None
    if session and session.user_id!=user.id: raise HTTPException(404,"Assistant session not found")
    if not session:
        session=AssistantSession(user_id=user.id,language=body.language,messages=[],context={}); db.add(session); db.flush()
    if session.state=="filed": raise HTTPException(409,"This session has already filed a complaint. Start a new conversation for another issue.")
    safe_message,_=redact_pii(body.message.strip())
    context=dict(session.context or {})
    if body.location_text: context.update({"location_text":body.location_text,"latitude":body.latitude,"longitude":body.longitude})
    session.context=context
    session.messages=[*session.messages,{"from":"resident","text":safe_message,"at":datetime.now(timezone.utc).isoformat()}]
    try: reply,tool=assistant_response(session.messages,body.language,context)
    except Exception: raise HTTPException(503,"The complaint assistant is temporarily unavailable. Your conversation is saved; try again shortly.")
    complaint=None
    if tool:
        location=tool.get("location_text") or context.get("location_text")
        if not location: raise HTTPException(422,"A verifiable location is required before filing")
        payload=ComplaintCreate(description=tool["description"],title=tool.get("title"),location_text=location,language=tool.get("language") or body.language,source_channel="assistant",latitude=context.get("latitude"),longitude=context.get("longitude"),voice_processing_consent=False)
        created=persist_complaint(db,payload,f"assistant:{session.id}",user)
        complaint=created["data"]["complaint"]
        session.state="filed"; session.complaint_id=complaint.id
        labels={"en":f"Filed successfully as {complaint.reference_number}. A reviewer must approve the AI recommendation before it is assigned.","hi":f"शिकायत {complaint.reference_number} के रूप में दर्ज हो गई। विभाग को भेजने से पहले समीक्षक AI सुझाव की जाँच करेगा।","mr":f"तक्रार {complaint.reference_number} म्हणून नोंदवली. विभागाकडे पाठवण्यापूर्वी तपासक AI सूचनेची पडताळणी करेल."}
        reply=labels.get(body.language,labels["en"])
    session.messages=[*session.messages,{"from":"assistant","text":reply,"at":datetime.now(timezone.utc).isoformat()}]
    db.commit()
    return {"data":AssistantSessionOut(session_id=session.id,reply=reply,state=session.state,complaint=complaint)}

@app.get("/api/reviewer/departments")
def reviewer_departments(user: User=Depends(require_roles(Role.reviewer,Role.admin)),db: Session=Depends(get_db)):
    return {"data":db.scalars(select(Department).where(Department.active.is_(True)).order_by(Department.name)).all()}

@app.post("/api/sms-simulator/message",include_in_schema=False)
def sms(body: SmsMessage,user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    raise HTTPException(410,"The SMS simulator has been removed. Telecom delivery will be configured separately.")
    session=db.get(SmsSession,body.session_id) if body.session_id else None
    if not session: session=SmsSession(language=body.language); db.add(session); db.flush()
    text=body.message.strip()
    locale=body.language if body.language in {"en","hi","mr"} else "en"
    prompts={"en":{"missing":"Reference not found in this simulator.","short":"Please describe the civic issue in one message and include a nearby landmark or ward.","ready":"Thank you. Add the nearest landmark if it is missing, then use the Lite form to confirm the report."},"hi":{"missing":"इस सिम्युलेटर में संदर्भ नहीं मिला।","short":"नागरिक समस्या एक संदेश में बताएं और पास का पहचान-चिह्न या वार्ड जोड़ें।","ready":"धन्यवाद। यदि स्थान नहीं लिखा है तो पास का पहचान-चिह्न जोड़ें, फिर लाइट फॉर्म में शिकायत की पुष्टि करें।"},"mr":{"missing":"या सिम्युलेटरमध्ये संदर्भ सापडला नाही.","short":"नागरी समस्या एका संदेशात सांगा आणि जवळची खूण किंवा प्रभाग जोडा.","ready":"धन्यवाद. ठिकाण दिले नसल्यास जवळची खूण जोडा, नंतर लाइट फॉर्ममध्ये तक्रार निश्चित करा."}}[locale]
    if text.lower().startswith("status "):
        ref=text.split(maxsplit=1)[1].upper(); c=db.scalar(select(Complaint).where(Complaint.reference_number==ref))
        identity=db.get(ReporterIdentity,c.reporter_identity_id) if c else None
        reply=f"{ref}: {c.status.value.replace('_',' ')}." if c and identity and identity.user_id==user.id else prompts["missing"]
    elif len(text)<12: reply=prompts["short"]
    else: reply=prompts["ready"]
    session.messages=[*session.messages,{"from":"resident","text":text,"at":datetime.now(timezone.utc).isoformat()},{"from":"nivaran","text":reply,"at":datetime.now(timezone.utc).isoformat()}]; db.commit()
    return {"data":{"session_id":session.id,"reply":reply,"state":session.state}}

@app.post("/api/complaints/{complaint_id}/evidence")
async def upload_evidence(complaint_id: str,file: UploadFile=File(...),user: User=Depends(current_user),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    if user.role==Role.resident:
        identity=db.get(ReporterIdentity,c.reporter_identity_id)
        if not identity or identity.user_id!=user.id: raise HTTPException(403,"Complaint belongs to another resident")
    if user.role==Role.department:
        assigned=db.scalar(select(Assignment).where(Assignment.complaint_id==c.id,Assignment.department_id==user.department_id))
        if not assigned: raise HTTPException(403,"Complaint is outside your assigned work")
    allowed={"image/jpeg","image/png","image/webp","audio/webm","audio/mpeg","video/mp4","video/webm"}
    if file.content_type not in allowed: raise HTTPException(415,"Unsupported evidence type")
    limit=25*1024*1024 if file.content_type.startswith("video/") else 8*1024*1024
    content=await file.read(limit+1)
    if len(content)>limit: raise HTTPException(413,f"Evidence exceeds {limit//1024//1024} MB")
    suffix={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","audio/webm":".webm","audio/mpeg":".mp3","video/mp4":".mp4","video/webm":".webm"}[file.content_type]
    name=f"{complaint_id}-{secrets.token_hex(8)}{suffix}"; path=Path(settings.upload_dir)/name; path.write_bytes(content)
    evidence_type="video" if file.content_type.startswith("video/") else "audio" if file.content_type.startswith("audio/") else "image"
    db.add(ComplaintEvidence(complaint_id=c.id,evidence_type=evidence_type,storage_reference=name,mime_type=file.content_type,size_bytes=len(content),provenance={"actor_id":user.id,"channel":"web"},retention_until=datetime.now(timezone.utc)+timedelta(days=90)))
    audit(db,"complaint",c.id,"evidence_uploaded",user,new={"mime":file.content_type,"size":len(content)}); db.commit()
    return {"data":{"storage_reference":name,"mime":file.content_type,"size":len(content)},"message":"Evidence stored with protected access."}

@app.get("/api/evidence/{storage_reference}")
def download_evidence(storage_reference: str,user: User=Depends(current_user),db: Session=Depends(get_db)):
    evidence=db.scalar(select(ComplaintEvidence).where(ComplaintEvidence.storage_reference==storage_reference))
    if not evidence: raise HTTPException(404,"Evidence not found")
    complaint=db.get(Complaint,evidence.complaint_id)
    if user.role==Role.resident:
        identity=db.get(ReporterIdentity,complaint.reporter_identity_id) if complaint else None
        if not identity or identity.user_id!=user.id: raise HTTPException(403,"Evidence belongs to another resident")
    if user.role==Role.department:
        assigned=db.scalar(select(Assignment).where(Assignment.complaint_id==evidence.complaint_id,Assignment.department_id==user.department_id))
        if not assigned: raise HTTPException(403,"Evidence is outside your assigned work")
    path=(Path(settings.upload_dir)/storage_reference).resolve(); root=Path(settings.upload_dir).resolve()
    if root not in path.parents or not path.exists(): raise HTTPException(404,"Evidence file not found")
    return FileResponse(path,media_type=evidence.mime_type,filename=storage_reference)

@app.post("/api/voice/transcribe-preview")
@limiter.limit("12/hour")
async def transcribe_preview(request: Request,file: UploadFile=File(...),voice_consent: str=Header(alias="X-Voice-Consent"),user: User=Depends(require_roles(Role.resident)),db: Session=Depends(get_db)):
    if voice_consent.lower()!="true": raise HTTPException(403,"Explicit voice processing consent is required")
    if file.content_type not in {"audio/webm","audio/mpeg","audio/wav","audio/mp4"}: raise HTTPException(415,"Unsupported audio type")
    content=await file.read(25*1024*1024+1)
    if len(content)>25*1024*1024: raise HTTPException(413,"Audio exceeds 25 MB")
    suffix={"audio/webm":".webm","audio/mpeg":".mp3","audio/wav":".wav","audio/mp4":".m4a"}[file.content_type]
    path=Path(settings.upload_dir)/f"voice-preview-{user.id}-{secrets.token_hex(8)}{suffix}"; path.write_bytes(content)
    try: voice_result=transcribe_audio(str(path)); transcript=voice_result["text"]
    except Exception: raise HTTPException(503,"Voice transcription is unavailable; type the complaint or try again")
    finally:
        path.unlink(missing_ok=True)
    safe,pii=redact_pii(transcript)
    audit(db,"user",user.id,"voice_preview_transcribed",user,new={"pii_types":pii,"provider":"sarvam","model":"saaras:v3"}); db.commit()
    return {"data":{"transcript":transcript,"safe_text":safe,"pii_detected":pii,"language":voice_result["language"]},"message":"Voice translated and ready for the complaint assistant."}

@app.post("/api/complaints/{complaint_id}/voice-transcribe")
async def voice_transcribe(complaint_id: str,file: UploadFile=File(...),tracking_pin: str|None=Header(default=None,alias="X-Tracking-PIN"),user: User|None=Depends(optional_current_user),db: Session=Depends(get_db)):
    c=db.get(Complaint,complaint_id)
    if not c: raise HTTPException(404,"Complaint not found")
    identity=db.get(ReporterIdentity,c.reporter_identity_id)
    owns_report=bool(user and identity and identity.user_id==user.id)
    if not owns_report and (not tracking_pin or not verify_pin(tracking_pin,c.tracking_pin_hash)): raise HTTPException(403,"A valid tracking PIN is required")
    consent=db.scalar(select(ConsentRecord).where(ConsentRecord.complaint_id==c.id,ConsentRecord.consent_type=="voice_processing",ConsentRecord.granted.is_(True)))
    if not consent: raise HTTPException(403,"Voice processing consent is required")
    if file.content_type not in {"audio/webm","audio/mpeg","audio/wav","audio/mp4"}: raise HTTPException(415,"Unsupported audio type")
    content=await file.read(25*1024*1024+1)
    if len(content)>25*1024*1024: raise HTTPException(413,"Audio exceeds 25 MB")
    suffix={"audio/webm":".webm","audio/mpeg":".mp3","audio/wav":".wav","audio/mp4":".m4a"}[file.content_type]
    name=f"{complaint_id}-voice-{secrets.token_hex(8)}{suffix}"; path=Path(settings.upload_dir)/name; path.write_bytes(content)
    db.add(ComplaintEvidence(complaint_id=c.id,evidence_type="audio",storage_reference=name,mime_type=file.content_type,size_bytes=len(content),provenance={"actor_id":user.id if user else None,"channel":"voice"},retention_until=datetime.now(timezone.utc)+timedelta(days=90)))
    try: voice_result=transcribe_audio(str(path)); transcript=voice_result["text"]
    except Exception:
        c.ai_state="unavailable"; c.status=ComplaintStatus.awaiting_review
        audit(db,"complaint",c.id,"voice_transcription_unavailable",user,new={"storage_reference":name},source="api")
        db.commit()
        raise HTTPException(503,"Transcription is unavailable; the recording remains stored for manual follow-up")
    safe,pii=redact_pii(transcript); c.original_text=transcript; c.safe_text=safe; c.pii_detected=sorted(set(c.pii_detected+pii)); c.ai_state="pending"; c.status=ComplaintStatus.submitted; c.version+=1
    job=db.scalar(select(ProcessingJob).where(ProcessingJob.complaint_id==c.id,ProcessingJob.kind=="triage"))
    if job: job.status=JobStatus.pending; job.error=None
    else: db.add(ProcessingJob(complaint_id=c.id))
    audit(db,"complaint",c.id,"voice_transcribed",user,new={"provider":"sarvam","model":"saaras:v3","pii_types":pii}); db.commit()
    return {"data":{"transcript":transcript,"safe_text":safe},"message":"Voice transcript saved and queued for structured triage."}
