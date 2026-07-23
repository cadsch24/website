"""Add scheduled_messages table for follow-up engine

Revision ID: 2a9b8c7d6e5f
Revises: 82ffaedab387
Create Date: 2026-07-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2a9b8c7d6e5f'
down_revision: Union[str, Sequence[str], None] = '82ffaedab387'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add scheduled_messages table."""
    op.create_table(
        'scheduled_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('lead_id', sa.Uuid(), nullable=False),
        sa.Column('business_id', sa.Uuid(), nullable=False),
        sa.Column('sequence_id', sa.Uuid(), nullable=True),
        sa.Column('sequence_step', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default=sa.text("'scheduled'")),
        sa.Column('message_content', sa.Text(), nullable=True),
        sa.Column('template_used', sa.String(length=100), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ),
        sa.ForeignKeyConstraint(['sequence_id'], ['followup_sequences.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Drop scheduled_messages table."""
    op.drop_table('scheduled_messages')