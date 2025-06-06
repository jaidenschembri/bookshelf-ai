"""Initial migration

Revision ID: abc1507568b0
Revises: 
Create Date: 2025-06-06 19:33:37.419407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc1507568b0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('readings', 'user_id',
               existing_type=sa.BIGINT(),
               type_=sa.Integer(),
               existing_nullable=False)
    op.alter_column('recommendations', 'user_id',
               existing_type=sa.BIGINT(),
               type_=sa.Integer(),
               existing_nullable=False)
    op.alter_column('users', 'id',
               existing_type=sa.BIGINT(),
               type_=sa.Integer(),
               existing_nullable=False,
               autoincrement=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('users', 'id',
               existing_type=sa.Integer(),
               type_=sa.BIGINT(),
               existing_nullable=False,
               autoincrement=True)
    op.alter_column('recommendations', 'user_id',
               existing_type=sa.Integer(),
               type_=sa.BIGINT(),
               existing_nullable=False)
    op.alter_column('readings', 'user_id',
               existing_type=sa.Integer(),
               type_=sa.BIGINT(),
               existing_nullable=False)
    # ### end Alembic commands ###
