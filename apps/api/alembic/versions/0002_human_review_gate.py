"""human priority and routing approval gate"""
from alembic import op
import sqlalchemy as sa

revision="0002_human_review_gate"
down_revision="0001_initial"
branch_labels=None
depends_on=None

def upgrade():
    op.add_column("complaints",sa.Column("priority_reviewed",sa.Boolean(),nullable=False,server_default=sa.false()))
    op.add_column("complaints",sa.Column("routing_approved",sa.Boolean(),nullable=False,server_default=sa.false()))

def downgrade():
    op.drop_column("complaints","routing_approved")
    op.drop_column("complaints","priority_reviewed")
