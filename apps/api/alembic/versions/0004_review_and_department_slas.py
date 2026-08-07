"""review and department SLA escalation markers"""
from alembic import op
import sqlalchemy as sa

revision="0004_review_and_department_slas"
down_revision="0003_resident_assistant"
branch_labels=None
depends_on=None

def upgrade():
    op.add_column("sla_records",sa.Column("review_due_at",sa.DateTime(timezone=True),nullable=True))
    op.add_column("sla_records",sa.Column("review_breached_at",sa.DateTime(timezone=True),nullable=True))
    op.add_column("sla_records",sa.Column("department_breached_at",sa.DateTime(timezone=True),nullable=True))

def downgrade():
    op.drop_column("sla_records","department_breached_at")
    op.drop_column("sla_records","review_breached_at")
    op.drop_column("sla_records","review_due_at")
