"""Add betting_price to market outcomes

Revision ID: add_betting_price
Revises: e293f5e365fe
Create Date: 2026-05-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_betting_price'
down_revision = 'e293f5e365fe'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()

    result = connection.execute(sa.text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='market_outcomes'
        AND column_name='betting_price'
    """))

    exists = result.fetchone()

    if not exists:
        op.add_column(
            'market_outcomes',
            sa.Column(
                'betting_price',
                sa.Float(),
                nullable=True,
                server_default='0.001'
            )
        )
