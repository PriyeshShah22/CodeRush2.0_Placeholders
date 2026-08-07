from app.schemas import ComplaintCreate
from app.security import hash_pin, pin_for_idempotency, verify_pin, hash_password, verify_password
from app.models import Priority
from datetime import datetime, timezone
from app.services import bounded_resolution_hours, distance_metres, hybrid_duplicate_score, redact_pii, utc_aware

def test_redacts_contact_and_aadhaar_like_values_before_model_processing():
    safe, kinds = redact_pii("Call 9876543210 or me@example.com. ID 1234 5678 9012")
    assert "9876543210" not in safe
    assert "me@example.com" not in safe
    assert "1234 5678 9012" not in safe
    assert set(kinds) == {"phone", "email", "aadhaar_like"}

def test_tracking_pin_and_password_verification():
    pin_hash = hash_pin("4827")
    assert verify_pin("4827", pin_hash)
    assert not verify_pin("0000", pin_hash)
    password_hash = hash_password("DemoResident!42")
    assert verify_password("DemoResident!42", password_hash)
    assert not verify_password("wrong-password", password_hash)

def test_complaint_contract_accepts_code_switched_text_and_incomplete_address():
    complaint = ComplaintCreate(description="Ward 7 में pipeline leak हो रही है", location_text="Shanti Chowk")
    assert complaint.language == "auto"
    assert complaint.source_channel == "web"

def test_duplicate_score_requires_more_than_semantics_alone():
    strong_context=hybrid_duplicate_score(.84,True,True)
    weak_context=hybrid_duplicate_score(.84,False,False)
    assert strong_context >= .78
    assert weak_context < .78

def test_retry_pin_is_stable_without_storing_plaintext():
    key="9b91f61d-faf5-4b91-8f34-829cf2cfb508"
    assert pin_for_idempotency(key)==pin_for_idempotency(key)
    assert pin_for_idempotency(key).isdigit()
    assert len(pin_for_idempotency(key))==4

def test_ai_resolution_recommendation_respects_priority_guardrails():
    assert bounded_resolution_hours(Priority.critical, 120, 72) == 24
    assert bounded_resolution_hours(Priority.high, 48, 72) == 48
    assert bounded_resolution_hours(Priority.normal, 240, 72) == 168
    assert bounded_resolution_hours(Priority.low, None, 72) == 72

def test_nearby_incident_distance_is_calculated_server_side():
    assert distance_metres(18.5204,73.8567,18.5204,73.8567)==0
    assert 900<distance_metres(18.5204,73.8567,18.5294,73.8567)<1100

def test_sqlite_naive_deadline_is_normalized_to_utc():
    naive=datetime(2026,8,8,1,0,0)
    assert utc_aware(naive).tzinfo==timezone.utc
    assert utc_aware(naive).hour==1
