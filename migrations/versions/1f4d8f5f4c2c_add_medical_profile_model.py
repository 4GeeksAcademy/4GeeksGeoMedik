"""add medical profile model

Revision ID: 1f4d8f5f4c2c
Revises: add_notification_model
Create Date: 2026-07-18 17:14:18.120345

"""
from alembic import op
import sqlalchemy as sa


revision = '1f4d8f5f4c2c'
down_revision = 'add_notification_model'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('medical_profile',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.Integer(), nullable=False),
    sa.Column('altura', sa.Integer(), nullable=False),
    sa.Column('peso', sa.Integer(), nullable=False),
    sa.Column('discapacidad', sa.String(length=255), nullable=True),
    sa.Column('enfermedades', sa.String(length=500), nullable=True),
    sa.Column('alergias', sa.String(length=500), nullable=True),
    sa.Column('medicamentos', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['client_id'], ['client.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('client_id')
    )


def downgrade():
    op.drop_table('medical_profile')
