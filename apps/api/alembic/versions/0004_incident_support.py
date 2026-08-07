"""nearby incident affected-resident confirmations"""
from alembic import op
import sqlalchemy as sa

revision="0004_incident_support"
down_revision="0003_resident_assistant"
branch_labels=None
depends_on=None

def upgrade():
    op.create_table(
        "incident_supports",
        sa.Column("id",sa.String(length=36),primary_key=True),
        sa.Column("incident_id",sa.String(length=36),sa.ForeignKey("incident_clusters.id",ondelete="CASCADE"),nullable=False),
        sa.Column("user_id",sa.String(length=36),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),
        sa.Column("latitude",sa.Float(),nullable=False),
        sa.Column("longitude",sa.Float(),nullable=False),
        sa.Column("distance_metres",sa.Float(),nullable=False),
        sa.Column("location_accuracy_metres",sa.Float(),nullable=True),
        sa.Column("verification_method",sa.String(length=32),nullable=False,server_default="browser_gps"),
        sa.Column("subscribed",sa.Boolean(),nullable=False,server_default=sa.true()),
        sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),
        sa.UniqueConstraint("incident_id","user_id",name="uq_incident_support_user"),
    )
    op.create_index("ix_incident_supports_incident_id","incident_supports",["incident_id"])
    op.create_index("ix_incident_supports_user_id","incident_supports",["user_id"])

def downgrade():
    op.drop_index("ix_incident_supports_user_id",table_name="incident_supports")
    op.drop_index("ix_incident_supports_incident_id",table_name="incident_supports")
    op.drop_table("incident_supports")
