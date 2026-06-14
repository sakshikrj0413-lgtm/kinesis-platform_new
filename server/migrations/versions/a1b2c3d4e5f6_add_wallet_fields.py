"""add wallet fields to users

Revision ID: a1b2c3d4e5f6
Revises: 3d273647a42c
Create Date: 2026-05-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '3d273647a42c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('wallet_address', sa.String(length=42), nullable=True))
        batch_op.add_column(sa.Column('chain_id', sa.Integer(), nullable=True))

    op.create_index('ix_users_wallet_address', 'users', ['wallet_address'], unique=True)


def downgrade():
    op.drop_index('ix_users_wallet_address', table_name='users')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('chain_id')
        batch_op.drop_column('wallet_address')