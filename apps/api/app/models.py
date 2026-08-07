import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from .db import Base

def now(): return datetime.now(timezone.utc)
def uid(): return str(uuid.uuid4())

class Role(str, enum.Enum):
    resident="resident"; reviewer="reviewer"; department="department"; admin="admin"
class ComplaintStatus(str, enum.Enum):
    submitted="submitted"; processing="processing"; awaiting_review="awaiting_review"; assigned="assigned"; acknowledged="acknowledged"; in_progress="in_progress"; escalated="escalated"; resolved="resolved"; reopened="reopened"
class Priority(str, enum.Enum):
    low="low"; normal="normal"; high="high"; critical="critical"
class JobStatus(str, enum.Enum):
    pending="pending"; processing="processing"; completed="completed"; failed="failed"; manual_review_required="manual_review_required"

class User(Base):
    __tablename__="users"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    email: Mapped[str]=mapped_column(String(255), unique=True, index=True)
    name: Mapped[str]=mapped_column(String(120))
    password_hash: Mapped[str]=mapped_column(String(255))
    role: Mapped[Role]=mapped_column(Enum(Role), index=True)
    department_id: Mapped[str|None]=mapped_column(ForeignKey("departments.id"))
    preferred_language: Mapped[str]=mapped_column(String(8), default="en")
    is_active: Mapped[bool]=mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class ReporterIdentity(Base):
    __tablename__="reporter_identities"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str|None]=mapped_column(ForeignKey("users.id"), index=True)
    display_name: Mapped[str|None]=mapped_column(String(120))
    phone: Mapped[str|None]=mapped_column(String(32))
    email: Mapped[str|None]=mapped_column(String(255))

class Department(Base):
    __tablename__="departments"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    code: Mapped[str]=mapped_column(String(40), unique=True)
    name: Mapped[str]=mapped_column(String(140))
    service_types: Mapped[list]=mapped_column(JSON, default=list)
    capacity: Mapped[int]=mapped_column(Integer, default=10)
    active: Mapped[bool]=mapped_column(Boolean, default=True)

class ServiceRule(Base):
    __tablename__="service_rules"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    category: Mapped[str]=mapped_column(String(80), index=True)
    ward: Mapped[str]=mapped_column(String(80), default="*")
    department_id: Mapped[str]=mapped_column(ForeignKey("departments.id"))
    acknowledgement_hours: Mapped[int]=mapped_column(Integer)
    resolution_hours: Mapped[int]=mapped_column(Integer)
    priority_rules: Mapped[dict]=mapped_column(JSON, default=dict)
    version: Mapped[str]=mapped_column(String(24), default="2026.1")

class Complaint(Base):
    __tablename__="complaints"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    reference_number: Mapped[str]=mapped_column(String(24), unique=True, index=True)
    tracking_pin_hash: Mapped[str]=mapped_column(String(255))
    reporter_identity_id: Mapped[str|None]=mapped_column(ForeignKey("reporter_identities.id"), index=True)
    original_text: Mapped[str]=mapped_column(Text)
    normalized_text: Mapped[str|None]=mapped_column(Text)
    translation_hi: Mapped[str|None]=mapped_column(Text)
    translation_mr: Mapped[str|None]=mapped_column(Text)
    safe_text: Mapped[str]=mapped_column(Text)
    title: Mapped[str|None]=mapped_column(String(160))
    language: Mapped[str]=mapped_column(String(16), default="und", index=True)
    source_channel: Mapped[str]=mapped_column(String(20), default="web", index=True)
    status: Mapped[ComplaintStatus]=mapped_column(Enum(ComplaintStatus), default=ComplaintStatus.submitted, index=True)
    category: Mapped[str|None]=mapped_column(String(80), index=True)
    category_confidence: Mapped[float|None]=mapped_column(Float)
    priority: Mapped[Priority]=mapped_column(Enum(Priority), default=Priority.normal, index=True)
    priority_confidence: Mapped[float|None]=mapped_column(Float)
    priority_reviewed: Mapped[bool]=mapped_column(Boolean, default=False)
    routing_approved: Mapped[bool]=mapped_column(Boolean, default=False)
    location_text: Mapped[str]=mapped_column(String(240))
    ward: Mapped[str|None]=mapped_column(String(80), index=True)
    latitude: Mapped[float|None]=mapped_column(Float)
    longitude: Mapped[float|None]=mapped_column(Float)
    ai_state: Mapped[str]=mapped_column(String(40), default="pending")
    ai_explanation: Mapped[str|None]=mapped_column(Text)
    pii_detected: Mapped[list]=mapped_column(JSON, default=list)
    version: Mapped[int]=mapped_column(Integer, default=1)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, index=True)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    reporter: Mapped[ReporterIdentity|None]=relationship()
    analysis: Mapped["ComplaintAnalysis|None"]=relationship(back_populates="complaint", uselist=False)
    __table_args__=(Index("ix_complaint_queue", "status","priority","ward","created_at"),)

class ComplaintAnalysis(Base):
    __tablename__="complaint_analyses"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), unique=True)
    entities: Mapped[dict]=mapped_column(JSON, default=dict)
    clarification_questions: Mapped[list]=mapped_column(JSON, default=list)
    route_factors: Mapped[dict]=mapped_column(JSON, default=dict)
    model_name: Mapped[str|None]=mapped_column(String(80))
    prompt_version: Mapped[str]=mapped_column(String(24), default="triage-v1")
    complaint: Mapped[Complaint]=relationship(back_populates="analysis")

class ComplaintEvidence(Base):
    __tablename__="complaint_evidence"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    evidence_type: Mapped[str]=mapped_column(String(24))
    storage_reference: Mapped[str]=mapped_column(String(255), unique=True)
    mime_type: Mapped[str]=mapped_column(String(80))
    size_bytes: Mapped[int]=mapped_column(Integer)
    provenance: Mapped[dict]=mapped_column(JSON, default=dict)
    redaction_state: Mapped[str]=mapped_column(String(24), default="not_required")
    retention_until: Mapped[datetime|None]=mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class IncidentCluster(Base):
    __tablename__="incident_clusters"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    title: Mapped[str]=mapped_column(String(180))
    category: Mapped[str]=mapped_column(String(80), index=True)
    ward: Mapped[str]=mapped_column(String(80), index=True)
    status: Mapped[str]=mapped_column(String(32), default="open")
    duplicate_count: Mapped[int]=mapped_column(Integer, default=1)
    embedding: Mapped[list|None]=mapped_column(Vector(1536))
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    __table_args__=(Index("ix_incident_embedding_hnsw","embedding",postgresql_using="hnsw",postgresql_ops={"embedding":"vector_cosine_ops"}),)

class IncidentComplaintLink(Base):
    __tablename__="incident_complaint_links"
    incident_id: Mapped[str]=mapped_column(ForeignKey("incident_clusters.id"), primary_key=True)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), primary_key=True)
    similarity_score: Mapped[float]=mapped_column(Float)
    reasons: Mapped[dict]=mapped_column(JSON, default=dict)

class RouteRecommendation(Base):
    __tablename__="route_recommendations"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    department_id: Mapped[str]=mapped_column(ForeignKey("departments.id"))
    score: Mapped[float]=mapped_column(Float)
    confidence: Mapped[float]=mapped_column(Float)
    factors: Mapped[dict]=mapped_column(JSON)
    service_rule_version: Mapped[str]=mapped_column(String(24))
    rank: Mapped[int]=mapped_column(Integer, default=1)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class Assignment(Base):
    __tablename__="assignments"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    department_id: Mapped[str]=mapped_column(ForeignKey("departments.id"), index=True)
    assigned_to_id: Mapped[str|None]=mapped_column(ForeignKey("users.id"))
    kind: Mapped[str]=mapped_column(String(20), default="primary")
    status: Mapped[str]=mapped_column(String(32), default="assigned", index=True)
    assigned_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    acknowledged_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True))

class TaskDependency(Base):
    __tablename__="task_dependencies"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    parent_assignment_id: Mapped[str]=mapped_column(ForeignKey("assignments.id"))
    depends_on_assignment_id: Mapped[str]=mapped_column(ForeignKey("assignments.id"))
    dependency_type: Mapped[str]=mapped_column(String(40), default="finish_to_start")

class SLARecord(Base):
    __tablename__="sla_records"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), unique=True)
    acknowledgement_due_at: Mapped[datetime]=mapped_column(DateTime(timezone=True))
    resolution_due_at: Mapped[datetime]=mapped_column(DateTime(timezone=True))
    risk_score: Mapped[float]=mapped_column(Float, default=0)
    breached_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True))
    escalation_level: Mapped[int]=mapped_column(Integer, default=0)
    simulated: Mapped[bool]=mapped_column(Boolean, default=False)

class AuditEvent(Base):
    __tablename__="audit_events"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    entity_type: Mapped[str]=mapped_column(String(40), index=True)
    entity_id: Mapped[str]=mapped_column(String(36), index=True)
    actor_id: Mapped[str|None]=mapped_column(ForeignKey("users.id"))
    actor_role: Mapped[str]=mapped_column(String(32))
    action: Mapped[str]=mapped_column(String(80), index=True)
    old_value: Mapped[dict|None]=mapped_column(JSON)
    new_value: Mapped[dict|None]=mapped_column(JSON)
    reason: Mapped[str|None]=mapped_column(Text)
    source_component: Mapped[str]=mapped_column(String(80), default="api")
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, index=True)

class HumanOverride(Base):
    __tablename__="human_overrides"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    field: Mapped[str]=mapped_column(String(40))
    previous_value: Mapped[str|None]=mapped_column(Text)
    new_value: Mapped[str]=mapped_column(Text)
    reason_code: Mapped[str]=mapped_column(String(80))
    note: Mapped[str|None]=mapped_column(Text)
    actor_id: Mapped[str]=mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class Notification(Base):
    __tablename__="notifications"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str|None]=mapped_column(ForeignKey("users.id"), index=True)
    complaint_id: Mapped[str|None]=mapped_column(ForeignKey("complaints.id"), index=True)
    channel: Mapped[str]=mapped_column(String(20), default="in_app")
    kind: Mapped[str]=mapped_column(String(40))
    message: Mapped[str]=mapped_column(Text)
    locale: Mapped[str]=mapped_column(String(8), default="en")
    read: Mapped[bool]=mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class ConsentRecord(Base):
    __tablename__="consent_records"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    consent_type: Mapped[str]=mapped_column(String(40))
    granted: Mapped[bool]=mapped_column(Boolean)
    policy_version: Mapped[str]=mapped_column(String(24), default="2026.1")
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class Appeal(Base):
    __tablename__="appeals"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    kind: Mapped[str]=mapped_column(String(24))
    message: Mapped[str]=mapped_column(Text)
    status: Mapped[str]=mapped_column(String(24), default="open")
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class ProcessingJob(Base):
    __tablename__="processing_jobs"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_id: Mapped[str]=mapped_column(ForeignKey("complaints.id"), index=True)
    kind: Mapped[str]=mapped_column(String(40), default="triage")
    status: Mapped[JobStatus]=mapped_column(Enum(JobStatus), default=JobStatus.pending, index=True)
    attempts: Mapped[int]=mapped_column(Integer, default=0)
    error: Mapped[str|None]=mapped_column(Text)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    __table_args__=(UniqueConstraint("complaint_id","kind",name="uq_job_complaint_kind"),)

class EvaluationItem(Base):
    __tablename__="evaluation_items"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    complaint_text: Mapped[str]=mapped_column(Text)
    language: Mapped[str]=mapped_column(String(16), index=True)
    source_channel: Mapped[str]=mapped_column(String(20), index=True)
    expected_category: Mapped[str]=mapped_column(String(80))
    expected_department: Mapped[str]=mapped_column(String(40))
    expected_priority: Mapped[str]=mapped_column(String(20))
    duplicate_cluster: Mapped[int|None]=mapped_column(Integer)

class EvaluationRun(Base):
    __tablename__="evaluation_runs"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str]=mapped_column(String(120))
    dataset_size: Mapped[int]=mapped_column(Integer)
    metrics: Mapped[dict]=mapped_column(JSON)
    model_name: Mapped[str]=mapped_column(String(80))
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)

class AssistantSession(Base):
    __tablename__="assistant_sessions"
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str]=mapped_column(ForeignKey("users.id"), index=True)
    messages: Mapped[list]=mapped_column(JSON, default=list)
    state: Mapped[str]=mapped_column(String(32), default="active")
    language: Mapped[str]=mapped_column(String(16), default="auto")
    complaint_id: Mapped[str|None]=mapped_column(ForeignKey("complaints.id"))
    context: Mapped[dict]=mapped_column(JSON, default=dict)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now)

# Compatibility name for old database imports; the simulator endpoint is disabled.
SmsSession=AssistantSession
