"""Create command history tables

Revision ID: 4619e14311fc
Revises: 
Create Date: 2025-05-11 22:22:16.688697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4619e14311fc'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "commandhistory",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("command_template_id", sa.Integer, sa.ForeignKey("commandtemplate.id")),
        sa.Column("execution_time", sa.DateTime, default=sa.DateTime.utcnow),
        sa.Column("status", sa.String, default="pending"),
        sa.Column("output", sa.Text, nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("is_template", sa.Boolean, default=False),
        sa.Column("command_string", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, default=sa.DateTime.utcnow, nullable=False),
        sa.Column("updated_at", sa.DateTime, default=sa.DateTime.utcnow, onupdate=sa.DateTime.utcnow, nullable=False),
    )

    op.create_table(
        "commandtemplate",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("command", sa.Text, nullable=False),
        sa.Column("command_pattern_id", sa.Integer, sa.ForeignKey("commandpattern.id")),
        sa.Column("created_at", sa.DateTime, default=sa.DateTime.utcnow, nullable=False),
        sa.Column("updated_at", sa.DateTime, default=sa.DateTime.utcnow, onupdate=sa.DateTime.utcnow, nullable=False),
    )

    op.create_table(
        "commandschedule",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("command_template_id", sa.Integer, sa.ForeignKey("commandtemplate.id")),
        sa.Column("schedule_time", sa.DateTime, nullable=False),
        sa.Column("last_run", sa.DateTime, nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, default=sa.DateTime.utcnow, nullable=False),
        sa.Column("updated_at", sa.DateTime, default=sa.DateTime.utcnow, onupdate=sa.DateTime.utcnow, nullable=False),
    )

    op.create_table(
        "commandpattern",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("pattern", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, default=sa.DateTime.utcnow, nullable=False),
        sa.Column("updated_at", sa.DateTime, default=sa.DateTime.utcnow, onupdate=sa.DateTime.utcnow, nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("commandhistory")
    op.drop_table("commandtemplate")
    op.drop_table("commandschedule")
    op.drop_table("commandpattern")
