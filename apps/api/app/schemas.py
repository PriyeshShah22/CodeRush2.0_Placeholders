from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from .models import ComplaintStatus, Priority, Role

class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)

class UserOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id: str; email: str; name: str; role: Role; department_id: str|None=None; preferred_language: str

class ComplaintCreate(BaseModel):
    description: str = Field(min_length=12, max_length=4000)
    title: str|None = Field(default=None, max_length=160)
    location_text: str = Field(min_length=3, max_length=240)
    language: str = "auto"
    source_channel: str = "web"
    ward: str|None = None
    latitude: float|None = Field(default=None, ge=-90, le=90)
    longitude: float|None = Field(default=None, ge=-180, le=180)
    reporter_name: str|None = None
    reporter_phone: str|None = None
    reporter_email: str|None = None
    notification_preference: str = "in_app"
    voice_processing_consent: bool = False

class ComplaintOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id: str; reference_number: str; title: str|None; original_text: str; safe_text: str
    normalized_text: str|None; translation_hi: str|None=None; translation_mr: str|None=None; language: str; source_channel: str; status: ComplaintStatus
    category: str|None; category_confidence: float|None; priority: Priority; priority_confidence: float|None
    priority_reviewed: bool; routing_approved: bool
    location_text: str; ward: str|None; latitude: float|None; longitude: float|None
    ai_state: str; ai_explanation: str|None; pii_detected: list; version: int
    created_at: datetime; updated_at: datetime
    linked_reports: int = 1

class ComplaintCreated(BaseModel):
    complaint: ComplaintOut
    tracking_pin: str
    message: str

class TrackRequest(BaseModel):
    reference_number: str
    tracking_pin: str = Field(min_length=4, max_length=12)

class OverrideRequest(BaseModel):
    field: str
    new_value: str
    reason_code: str
    note: str|None=None
    expected_version: int

class AssignRequest(BaseModel):
    primary_department_id: str
    supporting_department_id: str|None=None
    supporting_department_ids: list[str] = Field(default_factory=list, max_length=6)
    reason_code: str|None = Field(default=None,max_length=80)
    note: str|None = Field(default=None,max_length=1000)
    expected_version: int

class ReviewerDecisionRequest(BaseModel):
    category: str = Field(min_length=2,max_length=80)
    priority: Priority
    resolution_hours: int = Field(ge=1,le=720)
    reason_code: str|None = Field(default=None,max_length=80)
    note: str|None = Field(default=None,max_length=1000)
    expected_version: int

class StatusRequest(BaseModel):
    status: str
    note: str|None=None
    expected_version: int

class AdminResolutionRequest(BaseModel):
    expected_version: int
    note: str|None=Field(default=None,max_length=1000)

class AppealRequest(BaseModel):
    kind: str = "appeal"
    message: str = Field(min_length=12, max_length=2000)

class IncidentSupportRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    location_accuracy_metres: float|None = Field(default=None, ge=0, le=10000)

class AssistantMessage(BaseModel):
    session_id: str|None=None
    message: str = Field(min_length=1, max_length=1000)
    language: str="auto"
    location_text: str|None=Field(default=None,max_length=240)
    latitude: float|None=Field(default=None,ge=-90,le=90)
    longitude: float|None=Field(default=None,ge=-180,le=180)

class SmsMessage(AssistantMessage):
    pass

class AssistantSessionOut(BaseModel):
    session_id: str
    reply: str
    state: str
    complaint: ComplaintOut|None=None

class LocationSuggestion(BaseModel):
    display_name: str
    latitude: float
    longitude: float

class DepartmentUpsert(BaseModel):
    code: str = Field(min_length=2, max_length=40, pattern=r"^[a-z0-9_-]+$")
    name: str = Field(min_length=2, max_length=140)
    service_types: list[str] = Field(default_factory=list)
    capacity: int = Field(default=10, ge=1, le=10000)
    active: bool = True

class ServiceRuleUpsert(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    ward: str = Field(default="*", max_length=80)
    department_id: str
    acknowledgement_hours: int = Field(ge=1, le=720)
    resolution_hours: int = Field(ge=1, le=8760)
    priority_rules: dict = Field(default_factory=dict)
    version: str = Field(default="2026.1", max_length=24)

class ApiResponse(BaseModel):
    data: dict|list|None=None
    message: str|None=None
