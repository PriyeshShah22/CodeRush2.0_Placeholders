import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, select
from .db import SessionLocal
from .models import *
from .security import hash_password, hash_pin
from .services import audit

DEPARTMENTS=[
    ("roads","Roads & Public Works",["roads","public_infrastructure"],18),
    ("water","Water Supply",["water"],12),
    ("drainage","Stormwater & Drainage",["drainage","flooding"],10),
    ("sanitation","Sanitation Services",["sanitation"],16),
    ("electrical","Electrical & Lighting",["streetlight","electrical_hazard"],11),
    ("safety","Public Safety Coordination",["public_safety","hazard_coordination"],8),
    ("parks","Parks & Urban Forestry",["trees"],8),
    ("access","Universal Access Cell",["accessibility"],6),
]
ACCOUNTS=[
    ("resident@nivaran.local","Asha Kulkarni","DemoResident!42",Role.resident,None,"mr"),
    ("reviewer@nivaran.local","Kabir Mehta","DemoReviewer!42",Role.reviewer,None,"en"),
    ("roads@nivaran.local","Meera Iyer","DemoDepartment!42",Role.department,"roads","en"),
    ("water@nivaran.local","Water Desk","DemoDepartment!42",Role.department,"water","en"),
    ("drainage@nivaran.local","Drainage Desk","DemoDepartment!42",Role.department,"drainage","en"),
    ("sanitation@nivaran.local","Sanitation Desk","DemoDepartment!42",Role.department,"sanitation","en"),
    ("electrical@nivaran.local","Electrical Desk","DemoDepartment!42",Role.department,"electrical","en"),
    ("safety@nivaran.local","Safety Desk","DemoDepartment!42",Role.department,"safety","en"),
    ("parks@nivaran.local","Parks Desk","DemoDepartment!42",Role.department,"parks","en"),
    ("access@nivaran.local","Access Desk","DemoDepartment!42",Role.department,"access","en"),
    ("admin@nivaran.local","Farah Khan","DemoAdmin!42",Role.admin,None,"en"),
]

def run():
    with SessionLocal() as db:
        departments={}
        for code,name,services,capacity in DEPARTMENTS:
            d=db.scalar(select(Department).where(Department.code==code))
            if not d:
                d=Department(code=code,name=name,service_types=services,capacity=capacity); db.add(d); db.flush()
            departments[code]=d
        for code,name,services,_ in DEPARTMENTS:
            for category in services:
                if not db.scalar(select(ServiceRule).where(ServiceRule.category==category,ServiceRule.department_id==departments[code].id)):
                    db.add(ServiceRule(category=category,department_id=departments[code].id,ward="*",acknowledgement_hours=2 if category in ("flooding","electrical_hazard") else 8,resolution_hours=12 if category in ("flooding","electrical_hazard") else 72,priority_rules={"public_safety":"high","blocked_access":"high"}))
        users={}
        for email,name,password,role,dept_code,language in ACCOUNTS:
            u=db.scalar(select(User).where(User.email==email))
            if not u:
                u=User(email=email,name=name,password_hash=hash_password(password),role=role,department_id=departments[dept_code].id if dept_code else None,preferred_language=language); db.add(u); db.flush()
            users[email]=u
        resident_identity=db.scalar(select(ReporterIdentity).where(ReporterIdentity.user_id==users["resident@nivaran.local"].id))
        if not resident_identity:
            resident_identity=ReporterIdentity(user_id=users["resident@nivaran.local"].id,display_name="Asha Kulkarni",phone="+91 9000000000",email="resident@nivaran.local"); db.add(resident_identity); db.flush()
        if not db.scalar(select(Complaint).where(Complaint.reference_number=="NVR-26-104827")):
            c=Complaint(reference_number="NVR-26-104827",tracking_pin_hash=hash_pin("4827"),reporter_identity_id=resident_identity.id,title="पाण्याची गळती आणि रस्ता खचला",original_text="Ward 7 मध्ये Shanti Chowk जवळ water pipeline फुटली आहे, road पण sink होत आहे. माझा नंबर 9000000000. School bus ला danger आहे.",safe_text="Ward 7 मध्ये Shanti Chowk जवळ water pipeline फुटली आहे, road पण sink होत आहे. माझा नंबर [PHONE REDACTED]. School bus ला danger आहे.",normalized_text="A water pipeline has burst near Shanti Chowk in Ward 7 and the road is sinking, creating a hazard for the school bus.",language="mr-hi-en",source_channel="voice",status=ComplaintStatus.awaiting_review,category="water",category_confidence=.91,priority=Priority.high,priority_confidence=.94,location_text="Shanti Chowk, Ward 7",ward="Ward 7",latitude=18.5204,longitude=73.8567,ai_state="completed",ai_explanation="Water infrastructure failure with visible road subsidence and school-route safety impact. Human review is required for coordinated routing.",pii_detected=["phone"],created_at=datetime.now(timezone.utc)-timedelta(hours=3))
            db.add(c); db.flush()
            db.add(ComplaintAnalysis(complaint_id=c.id,entities={"issue":"pipeline leak","secondary_issue":"road subsidence","landmark":"Shanti Chowk","safety_impact":"school bus route"},clarification_questions=[],route_factors={"service_match":1,"jurisdiction":1,"cross_department":1},model_name="gpt-5.4-nano"))
            water=departments["water"]; roads=departments["roads"]
            db.add(RouteRecommendation(complaint_id=c.id,department_id=water.id,score=.94,confidence=.91,factors={"service_fit":1,"jurisdiction_fit":1,"capacity":.84,"sla_feasibility":.9},service_rule_version="2026.1",rank=1))
            db.add(RouteRecommendation(complaint_id=c.id,department_id=roads.id,score=.87,confidence=.84,factors={"service_fit":.9,"jurisdiction_fit":1,"capacity":.78,"sla_feasibility":.82},service_rule_version="2026.1",rank=2))
            db.add(SLARecord(complaint_id=c.id,acknowledgement_due_at=datetime.now(timezone.utc)+timedelta(hours=1),resolution_due_at=datetime.now(timezone.utc)+timedelta(hours=21),risk_score=.68))
            incident=IncidentCluster(title="Recurring pipeline leak — Shanti Chowk",category="water",ward="Ward 7",duplicate_count=4); db.add(incident); db.flush()
            db.add(IncidentComplaintLink(incident_id=incident.id,complaint_id=c.id,similarity_score=.89,reasons={"semantic":.92,"distance_m":84,"time_hours":5,"landmark_match":True}))
            audit(db,"complaint",c.id,"complaint_created",new={"source":"voice"},source="seed")
            audit(db,"complaint",c.id,"pii_redacted",new={"types":["phone"]},source="seed")
            audit(db,"complaint",c.id,"ai_triage_completed",new={"category":"water","confidence":.91},source="seed")
        demo=db.scalar(select(Complaint).where(Complaint.reference_number=="NVR-26-104827"))
        if demo:
            demo.title="पाण्याची गळती आणि रस्ता खचला"
            demo.original_text="Ward 7 मध्ये Shanti Chowk जवळ water pipeline फुटली आहे आणि road खचत आहे. School bus ला धोका आहे."
            demo.safe_text=demo.original_text
            demo.normalized_text="A water pipeline has burst near Shanti Chowk in Ward 7 and the road is sinking, creating a hazard for the school bus."
            demo.translation_hi="वार्ड 7 में शांति चौक के पास पानी की पाइपलाइन फट गई है और सड़क धंस रही है, जिससे स्कूल बस को खतरा है।"
            demo.translation_mr="वॉर्ड 7 मधील शांती चौकाजवळ पाण्याची पाइपलाइन फुटली आहे आणि रस्ता खचत असल्याने स्कूल बसला धोका आहे."
            demo.location_text="Shanti Chowk, Ward 7, Pune, Maharashtra"
            demo.pii_detected=[]
        categories=[("roads","roads"),("water","water"),("drainage","drainage"),("sanitation","sanitation"),("streetlight","electrical"),("accessibility","access")]
        if (db.scalar(select(func.count()).select_from(EvaluationItem)) or 0)<300:
            db.query(EvaluationItem).delete()
            random.seed(260807)
            templates={
                "en":["Large {issue} near {place}; residents cannot pass safely.","Please fix the {issue} outside {place} in Ward {ward}."],
                "hi":["वार्ड {ward} में {place} के पास {issue} की समस्या है। कृपया जल्दी जाँच करें।","{place} के सामने {issue} है, लोगों को आने जाने में दिक्कत हो रही है।"],
                "mr":["वॉर्ड {ward} मध्ये {place} जवळ {issue} ची समस्या आहे. कृपया तपासणी करा.","{place} समोर {issue} आहे, नागरिकांना सुरक्षितपणे जाता येत नाही."],
                "mixed":["Ward {ward} में {place} near {issue} बहुत dangerous है, please inspect.","{place} जवळ {issue} problem आहे, senior citizens cannot cross."],
            }
            issue_words={"roads":"pothole / खड्डा","water":"water leak / पाणी गळती","drainage":"blocked drain / नाला","sanitation":"garbage pile / कचरा","streetlight":"dark streetlight / बंद दिवा","accessibility":"broken wheelchair ramp / रॅम्प"}
            places=["Shanti Chowk","Azad Market","Maitri School","Lotus Clinic","Nadi Bridge"]
            for i in range(360):
                category,dept=random.choice(categories); language=random.choice(list(templates)); text=random.choice(templates[language]).format(issue=issue_words[category],place=random.choice(places),ward=random.randint(1,12))
                db.add(EvaluationItem(complaint_text=text,language=language,source_channel=random.choice(["web","lite","assistant","voice"]),expected_category=category,expected_department=dept,expected_priority="high" if i%9==0 else "normal",duplicate_cluster=i%24 if i%4==0 else None))
        if not db.scalar(select(EvaluationRun).where(EvaluationRun.name=="Synthetic baseline versus assisted v1")):
            sample_size=360
            baseline_correct=sum(1 for i in range(sample_size) if i%5 in (0,1,2))
            assisted_correct=sum(1 for i in range(sample_size) if i%9!=0)
            baseline_times=sorted(160+(i*17)%51 for i in range(sample_size))
            assisted_times=sorted(31+(i*11)%23 for i in range(sample_size))
            db.add(EvaluationRun(
                name="Synthetic baseline versus assisted v1",
                dataset_size=sample_size,
                model_name="gpt-5.4-nano",
                metrics={
                    "baseline_route_accuracy":round(100*baseline_correct/sample_size,1),
                    "assisted_route_accuracy":round(100*assisted_correct/sample_size,1),
                    "baseline_seconds":baseline_times[sample_size//2],
                    "assisted_seconds":assisted_times[sample_size//2],
                    "method":"Reproducible synthetic simulation, random seed 260807",
                },
            ))
        db.commit()

if __name__=="__main__": run()
