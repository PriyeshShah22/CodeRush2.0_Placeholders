from app.backfill_translations import needs_translation
from app.services import ExtractedEntities, TriageOutput


def test_structured_triage_requires_persisted_hindi_and_marathi():
    triage = TriageOutput(
        language="en",
        code_switched=False,
        normalized_translation="A pothole blocks the school road.",
        translation_hi="विद्यालय मार्ग पर गड्ढा है।",
        translation_mr="शाळेच्या रस्त्यावर खड्डा आहे.",
        category="roads",
        category_confidence=0.95,
        priority="high",
        priority_confidence=0.9,
        resolution_hours=24,
        entities=ExtractedEntities(
            issue="pothole",
            secondary_issue=None,
            landmark="school",
            ward=None,
            safety_impact="traffic obstruction",
            affected_group=None,
        ),
        clarification_questions=[],
        explanation="The obstruction affects a school road.",
    )

    assert triage.translation_hi == "विद्यालय मार्ग पर गड्ढा है।"
    assert triage.translation_mr == "शाळेच्या रस्त्यावर खड्डा आहे."


def test_backfill_detects_missing_or_english_translation():
    assert needs_translation(None)
    assert needs_translation("Pothole near school")
    assert not needs_translation("विद्यालय के पास गड्ढा")
