"""add_credit_system

Revision ID: a1b2c3d4e5f6
Revises: 6d595812eb83
Create Date: 2026-03-16 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6d595812eb83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create credit_transactions table
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dealer_profile_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('transaction_type', sa.Enum('usage', 'settlement', name='credittransactiontype'), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settled_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['dealer_profile_id'], ['dealer_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['settled_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_credit_transactions_id'), 'credit_transactions', ['id'], unique=False)

    # Add payment_method column to orders
    paymentmethod_enum = sa.Enum('razorpay', 'credit', name='paymentmethod')
    paymentmethod_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('orders', sa.Column(
        'payment_method',
        paymentmethod_enum,
        server_default='razorpay',
        nullable=False,
    ))

    # Add credit_due_date column to orders
    op.add_column('orders', sa.Column('credit_due_date', sa.DateTime(timezone=True), nullable=True))

    # Add credit_pending to paymentstatus enum
    op.execute("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'credit_pending'")


def downgrade() -> None:
    op.drop_column('orders', 'credit_due_date')
    op.drop_column('orders', 'payment_method')
    op.drop_index(op.f('ix_credit_transactions_id'), table_name='credit_transactions')
    op.drop_table('credit_transactions')

    # Drop the paymentmethod enum type
    op.execute("DROP TYPE IF EXISTS paymentmethod")

    # Note: Removing a value from a PostgreSQL enum is not straightforward
    # The credit_pending value in paymentstatus will remain
