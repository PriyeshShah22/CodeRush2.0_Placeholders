"""resident complaint assistant and persisted translations"""
from alembic import op
import sqlalchemy as sa

revision="0003_resident_assistant"
down_revision="0002_human_review_gate"
branch_labels=None
depends_on=None

def upgrade():
    inspector=sa.inspect(op.get_bind())
    columns={column["name"] for column in inspector.get_columns("complaints")}
    if "translation_hi" not in columns:
        op.add_column("complaints",sa.Column("translation_hi",sa.Text(),nullable=True))
    if "translation_mr" not in columns:
        op.add_column("complaints",sa.Column("translation_mr",sa.Text(),nullable=True))
    if not inspector.has_table("assistant_sessions"):
        op.create_table(
        "assistant_sessions",
        sa.Column("id",sa.String(length=36),primary_key=True),
        sa.Column("user_id",sa.String(length=36),sa.ForeignKey("users.id"),nullable=False),
        sa.Column("messages",sa.JSON(),nullable=False),
        sa.Column("state",sa.String(length=32),nullable=False),
        sa.Column("language",sa.String(length=16),nullable=False),
        sa.Column("complaint_id",sa.String(length=36),sa.ForeignKey("complaints.id"),nullable=True),
        sa.Column("context",sa.JSON(),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),
        sa.Column("updated_at",sa.DateTime(timezone=True),nullable=False),
        )
        op.create_index("ix_assistant_sessions_user_id","assistant_sessions",["user_id"])

def downgrade():
    op.drop_index("ix_assistant_sessions_user_id",table_name="assistant_sessions")
    op.drop_table("assistant_sessions")
    op.drop_column("complaints","translation_mr")
    op.drop_column("complaints","translation_hi")
