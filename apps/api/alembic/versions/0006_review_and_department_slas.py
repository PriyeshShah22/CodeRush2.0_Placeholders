"""review and department SLA escalation markers"""
from alembic import op
import sqlalchemy as sa

revision="0006_review_and_department_slas"
down_revision="0005_incident_support"
branch_labels=None
depends_on=None

def upgrade():
    columns={column["name"] for column in sa.inspect(op.get_bind()).get_columns("sla_records")}
    if "review_due_at" not in columns:
        op.add_column("sla_records",sa.Column("review_due_at",sa.DateTime(timezone=True),nullable=True))
    if "review_breached_at" not in columns:
        op.add_column("sla_records",sa.Column("review_breached_at",sa.DateTime(timezone=True),nullable=True))
    if "department_breached_at" not in columns:
        op.add_column("sla_records",sa.Column("department_breached_at",sa.DateTime(timezone=True),nullable=True))
    op.execute("UPDATE sla_records SET review_due_at=acknowledgement_due_at WHERE review_due_at IS NULL")

def downgrade():
    op.drop_column("sla_records","department_breached_at")
    op.drop_column("sla_records","review_breached_at")
    op.drop_column("sla_records","review_due_at")
