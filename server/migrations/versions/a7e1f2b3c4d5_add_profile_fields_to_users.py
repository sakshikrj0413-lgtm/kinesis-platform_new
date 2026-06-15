"""Add profile fields to users

Revision ID: a7e1f2b3c4d5
Revises: 573c39d7a60a
Create Date: 2026-06-14 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7e1f2b3c4d5'
down_revision = '573c39d7a60a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatar_url', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('phone', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('bio', sa.String(length=300), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('bio')
        batch_op.drop_column('phone')
        batch_op.drop_column('avatar_url')