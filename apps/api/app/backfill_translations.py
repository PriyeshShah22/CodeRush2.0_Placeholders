"""One-time repair for complaints created before persisted multilingual triage."""

import argparse
import re

from sqlalchemy import select

from .db import SessionLocal
from .models import Complaint
from .services import openai_triage


DEVANAGARI = re.compile(r"[\u0900-\u097f]")


def needs_translation(value: str | None) -> bool:
    return not value or not DEVANAGARI.search(value)


def run(force_references: set[str] | None = None) -> tuple[int, int]:
    updated = 0
    failed = 0
    with SessionLocal() as db:
        complaint_ids = [
            complaint.id
            for complaint in db.scalars(select(Complaint)).all()
            if complaint.reference_number in (force_references or set())
            or needs_translation(complaint.translation_hi)
            or needs_translation(complaint.translation_mr)
        ]

        for complaint_id in complaint_ids:
            try:
                complaint = db.get(Complaint, complaint_id)
                if not complaint:
                    continue
                triage = openai_triage(complaint)
                complaint.translation_hi = triage.translation_hi
                complaint.translation_mr = triage.translation_mr
                complaint.version += 1
                db.commit()
                updated += 1
                print(f"translated {complaint.reference_number}")
            except Exception as exc:
                db.rollback()
                failed += 1
                print(f"failed {complaint_id}: {type(exc).__name__}")

    return updated, failed


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", action="append", default=[])
    args = parser.parse_args()
    completed, errors = run(set(args.reference))
    print(f"translation backfill complete: updated={completed} failed={errors}")
