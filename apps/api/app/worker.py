import logging
import time
from sqlalchemy import select
from .db import SessionLocal
from .models import JobStatus, ProcessingJob
from .services import evaluate_sla, process_complaint

logging.basicConfig(level=logging.INFO,format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger=logging.getLogger("nivaran.worker")

def tick():
    with SessionLocal() as db:
        job=db.scalar(select(ProcessingJob).where(ProcessingJob.status==JobStatus.pending).with_for_update(skip_locked=True).limit(1))
        if job: process_complaint(db,job)
        evaluate_sla(db)

if __name__=="__main__":
    while True:
        try: tick()
        except Exception:
            logger.exception("worker_tick_failed")
        time.sleep(5)
