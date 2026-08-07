"""add department resolution verification state

Revision ID: 0004_resolution_verification
Revises: 0003_resident_assistant
"""

from alembic import op

revision = "0004_resolution_verification"
down_revision = "0003_resident_assistant"
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            "ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'resolution_submitted'"
        )


def downgrade():
    # PostgreSQL enum values cannot be removed safely while persisted rows may
    # still reference them. Keeping the value is the non-destructive rollback.
    pass
