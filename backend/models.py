"""
Database models for Palm Oil Business Management System
"""

from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import bcrypt
import config

Base = declarative_base()


# ============= AUTHENTICATION MODELS =============

# Many-to-many relationship table for roles and permissions
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)


class User(Base):
    """User accounts for authentication"""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship('Role', back_populates='users')

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role_id': self.role_id,
            'role_name': self.role.name if self.role else None,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat()
        }


class Role(Base):
    """User roles for RBAC"""
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)  # Admin, Manager, Operator, Viewer
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship('User', back_populates='role')
    permissions = relationship('Permission', secondary=role_permissions, back_populates='roles')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'permissions': [p.to_dict() for p in self.permissions]
        }


class Permission(Base):
    """Permissions for resources and actions"""
    __tablename__ = 'permissions'

    id = Column(Integer, primary_key=True)
    resource = Column(String(50), nullable=False)  # harvest, milling, storage, sales
    action = Column(String(20), nullable=False)    # create, read, update, delete
    description = Column(String(255))

    # Relationships
    roles = relationship('Role', secondary=role_permissions, back_populates='permissions')

    def to_dict(self):
        return {
            'id': self.id,
            'resource': self.resource,
            'action': self.action,
            'description': self.description
        }


# ============= BUSINESS MODELS =============


class Harvest(Base):
    """FFB Harvest records"""
    __tablename__ = 'harvests'

    id = Column(Integer, primary_key=True)
    harvest_date = Column(Date, nullable=False)
    plantation = Column(String(50), nullable=False)
    num_bunches = Column(Integer, nullable=False)
    weight_per_bunch = Column(Float, nullable=False)  # kg
    ripeness = Column(String(20), nullable=False)  # ripe/unripe

    # Purchase information
    is_purchased = Column(Boolean, default=False)  # True if purchased, False if own harvest
    supplier_name = Column(String(100), nullable=True)  # Supplier name if purchased
    purchase_price = Column(Float, nullable=True)  # Total purchase price in Naira

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    milling_records = relationship('Milling', back_populates='harvest')

    @property
    def total_weight(self):
        """Calculate total FFB weight"""
        return self.num_bunches * self.weight_per_bunch

    @property
    def expected_oil_yield(self):
        """Calculate expected CPO yield based on OER"""
        return self.total_weight * config.OER_PERCENTAGE

    @property
    def expected_oil_yield_liters(self):
        """Calculate expected CPO yield in liters"""
        return self.expected_oil_yield / config.CPO_DENSITY

    @property
    def ffb_cost(self):
        """Calculate FFB cost - use purchase price if purchased, otherwise estimate"""
        if self.is_purchased and self.purchase_price:
            return self.purchase_price
        else:
            # For own harvest, estimate based on weight (can be customized)
            return self.total_weight * 50  # Default ₦50/kg for own harvest

    @property
    def cost_per_kg(self):
        """Calculate cost per kg of FFB"""
        if self.total_weight > 0:
            return self.ffb_cost / self.total_weight
        return 0

    @property
    def needs_milling_alert(self):
        """Check if FFB needs milling alert"""
        time_since_harvest = datetime.utcnow() - datetime.combine(self.harvest_date, datetime.min.time())
        return time_since_harvest.total_seconds() / 3600 > config.MILLING_ALERT_HOURS

    def to_dict(self):
        return {
            'id': self.id,
            'harvest_date': self.harvest_date.isoformat(),
            'plantation': self.plantation,
            'num_bunches': self.num_bunches,
            'weight_per_bunch': self.weight_per_bunch,
            'ripeness': self.ripeness,
            'total_weight': self.total_weight,
            'expected_oil_yield': self.expected_oil_yield,
            'expected_oil_yield_liters': self.expected_oil_yield_liters,
            'is_purchased': self.is_purchased,
            'supplier_name': self.supplier_name,
            'purchase_price': self.purchase_price,
            'ffb_cost': self.ffb_cost,
            'cost_per_kg': self.cost_per_kg,
            'needs_milling_alert': self.needs_milling_alert,
            'created_at': self.created_at.isoformat()
        }


class Milling(Base):
    """Milling operations records"""
    __tablename__ = 'milling'

    id = Column(Integer, primary_key=True)
    milling_date = Column(Date, nullable=False)
    mill_location = Column(String(50), nullable=False)
    harvest_id = Column(Integer, ForeignKey('harvests.id'))
    milling_cost = Column(Float, nullable=False)  # Naira
    oil_yield = Column(Float, nullable=False)  # kg
    transport_cost = Column(Float, default=0)  # Naira
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    harvest = relationship('Harvest', back_populates='milling_records')
    storage_records = relationship('Storage', back_populates='milling')

    @property
    def oil_yield_liters(self):
        """Calculate oil yield in liters"""
        return self.oil_yield / config.CPO_DENSITY

    @property
    def cost_per_kg(self):
        """Calculate cost per kg of oil"""
        total_cost = self.milling_cost + self.transport_cost
        if self.oil_yield > 0:
            return total_cost / self.oil_yield
        return 0

    @property
    def cost_per_liter(self):
        """Calculate cost per liter of oil"""
        if self.oil_yield_liters > 0:
            return self.total_cost / self.oil_yield_liters
        return 0

    @property
    def ffb_cost(self):
        """Get FFB cost from harvest"""
        if self.harvest:
            return self.harvest.ffb_cost  # Use actual FFB cost from harvest
        return 0

    @property
    def total_cost(self):
        """Calculate total production cost"""
        return self.ffb_cost + self.milling_cost + self.transport_cost

    def to_dict(self):
        return {
            'id': self.id,
            'milling_date': self.milling_date.isoformat(),
            'mill_location': self.mill_location,
            'harvest_id': self.harvest_id,
            'milling_cost': self.milling_cost,
            'oil_yield': self.oil_yield,
            'oil_yield_liters': self.oil_yield_liters,
            'transport_cost': self.transport_cost,
            'cost_per_kg': self.cost_per_kg,
            'cost_per_liter': self.cost_per_liter,
            'total_cost': self.total_cost,
            'created_at': self.created_at.isoformat()
        }


class Storage(Base):
    """CPO Storage inventory"""
    __tablename__ = 'storage'

    id = Column(Integer, primary_key=True)
    container_id = Column(String(50), unique=True, nullable=False)
    milling_id = Column(Integer, ForeignKey('milling.id'))
    quantity = Column(Float, nullable=False)  # kg
    storage_date = Column(Date, nullable=False)
    max_shelf_life_days = Column(Integer, default=config.DEFAULT_SHELF_LIFE_DAYS)
    plantation_source = Column(String(50), nullable=False)
    is_sold = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    milling = relationship('Milling', back_populates='storage_records')
    sales_records = relationship('Sale', back_populates='storage')

    @property
    def expiry_date(self):
        """Calculate expiry date"""
        return self.storage_date + timedelta(days=self.max_shelf_life_days)

    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        delta = self.expiry_date - datetime.utcnow().date()
        return delta.days

    @property
    def is_near_expiry(self):
        """Check if CPO is near expiry"""
        return self.days_until_expiry <= config.STORAGE_EXPIRY_WARNING_DAYS and not self.is_sold

    @property
    def is_expired(self):
        """Check if CPO has expired"""
        return self.days_until_expiry < 0 and not self.is_sold

    @property
    def quantity_liters(self):
        """Calculate quantity in liters"""
        return self.quantity / config.CPO_DENSITY

    @property
    def total_sold(self):
        """Calculate total quantity sold from this container"""
        return sum(sale.quantity_sold for sale in self.sales_records)

    @property
    def remaining_quantity(self):
        """Calculate remaining quantity in storage"""
        return self.quantity - self.total_sold

    @property
    def remaining_quantity_liters(self):
        """Calculate remaining quantity in liters"""
        return self.remaining_quantity / config.CPO_DENSITY

    def to_dict(self):
        return {
            'id': self.id,
            'container_id': self.container_id,
            'milling_id': self.milling_id,
            'quantity': self.quantity,
            'quantity_liters': self.quantity_liters,
            'total_sold': self.total_sold,
            'remaining_quantity': self.remaining_quantity,
            'remaining_quantity_liters': self.remaining_quantity_liters,
            'storage_date': self.storage_date.isoformat(),
            'max_shelf_life_days': self.max_shelf_life_days,
            'plantation_source': self.plantation_source,
            'is_sold': self.is_sold,
            'expiry_date': self.expiry_date.isoformat(),
            'days_until_expiry': self.days_until_expiry,
            'is_near_expiry': self.is_near_expiry,
            'is_expired': self.is_expired,
            'created_at': self.created_at.isoformat()
        }


class Sale(Base):
    """Sales transactions"""
    __tablename__ = 'sales'

    id = Column(Integer, primary_key=True)
    sale_date = Column(Date, nullable=False)
    buyer_name = Column(String(100), nullable=False)
    storage_id = Column(Integer, ForeignKey('storage.id'))
    quantity_sold = Column(Float, nullable=False)  # kg
    price_per_kg = Column(Float, nullable=False)  # Naira
    payment_status = Column(String(20), nullable=False)  # Paid/Pending
    payment_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    storage = relationship('Storage', back_populates='sales_records')

    @property
    def total_revenue(self):
        """Calculate total revenue from sale"""
        return self.quantity_sold * self.price_per_kg

    @property
    def is_payment_pending(self):
        """Check if payment is pending"""
        return self.payment_status.lower() == 'pending'

    @property
    def quantity_sold_liters(self):
        """Calculate quantity sold in liters"""
        return self.quantity_sold / config.CPO_DENSITY

    def to_dict(self):
        return {
            'id': self.id,
            'sale_date': self.sale_date.isoformat(),
            'buyer_name': self.buyer_name,
            'storage_id': self.storage_id,
            'quantity_sold': self.quantity_sold,
            'quantity_sold_liters': self.quantity_sold_liters,
            'price_per_kg': self.price_per_kg,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'total_revenue': self.total_revenue,
            'is_payment_pending': self.is_payment_pending,
            'created_at': self.created_at.isoformat()
        }


def init_db():
    """Initialize the database"""
    engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(engine)
    return engine
