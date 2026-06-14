"""merge migration heads

Revision ID: 9ea5b73d2176
Revises: add_betting_price, c65bd826f20a, f3a4b5c6d7e8
Create Date: 2026-05-20 13:58:30.559995

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ea5b73d2176'
down_revision = ('add_betting_price', 'c65bd826f20a', 'f3a4b5c6d7e8')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
