"""Add audit log table

Revision ID: 596ae28e39ad
Revises: 4619e14311fc
Create Date: 2025-05-11 22:36:57.957216

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '596ae28e39ad'
down_revision: Union[str, None] = '4619e14311fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
