"""add wallet address to bets

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-17 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('bets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('wallet_address', sa.String(length=42), nullable=True))


def downgrade():
    with op.batch_alter_table('bets', schema=None) as batch_op:
        batch_op.drop_column('wallet_address')