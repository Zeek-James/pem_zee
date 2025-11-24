"""
Database models for Palm Oil Business Management System
"""

from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Table, JSON, Text
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
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship('Role', back_populates='users')
    organization = relationship('Organization', back_populates='users')

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
            'organization_id': self.organization_id,
            'organization_name': self.organization.name if self.organization else None,
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


class AuditLog(Base):
    """Audit log for tracking all system changes"""
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    entity_type = Column(String(50), nullable=False)  # harvest, milling, storage, sale
    entity_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)  # create, update, delete
    old_values = Column(JSON, nullable=True)  # Before state
    new_values = Column(JSON, nullable=True)  # After state
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action': self.action,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat()
        }


# ============= ORGANIZATIONAL MODELS =============


class Organization(Base):
    """Organization/Company managing palm oil operations"""
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)  # ORG001
    address = Column(String(255))
    phone = Column(String(20))
    email = Column(String(120))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship('User', back_populates='organization')
    farms = relationship('Farm', back_populates='organization', cascade='all, delete-orphan')
    harvests = relationship('Harvest', back_populates='organization')
    millings = relationship('Milling', back_populates='organization')
    storages = relationship('Storage', back_populates='organization')
    sales = relationship('Sale', back_populates='organization')
    buyers = relationship('Buyer', back_populates='organization', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Farm(Base):
    """Farm containing multiple plantations"""
    __tablename__ = 'farms'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255))
    total_area_hectares = Column(Float)
    manager_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='farms')
    plantations = relationship('Plantation', back_populates='farm', cascade='all, delete-orphan')
    manager = relationship('User', foreign_keys=[manager_id])

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'name': self.name,
            'location': self.location,
            'total_area_hectares': self.total_area_hectares,
            'manager_id': self.manager_id,
            'manager_name': self.manager.full_name if self.manager else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Plantation(Base):
    """Individual plantation within a farm"""
    __tablename__ = 'plantations'

    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey('farms.id'), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Owerri, Aba, etc.
    code = Column(String(20), unique=True, nullable=False, index=True)  # PLN001
    area_hectares = Column(Float)
    tree_count = Column(Integer)
    planting_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farm = relationship('Farm', back_populates='plantations')
    harvests = relationship('Harvest', back_populates='plantation')

    def to_dict(self):
        return {
            'id': self.id,
            'farm_id': self.farm_id,
            'farm_name': self.farm.name if self.farm else None,
            'name': self.name,
            'code': self.code,
            'area_hectares': self.area_hectares,
            'tree_count': self.tree_count,
            'planting_date': self.planting_date.isoformat() if self.planting_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Buyer(Base):
    """Buyer/Customer for palm oil sales"""
    __tablename__ = 'buyers'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    company_name = Column(String(100), nullable=False)
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(120))
    address = Column(String(255))
    payment_terms = Column(String(50))  # Cash, 30 days credit, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='buyers')
    sales = relationship('Sale', back_populates='buyer')

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'company_name': self.company_name,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'payment_terms': self.payment_terms,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# ============= BUSINESS MODELS =============


class Harvest(Base):
    """FFB Harvest records"""
    __tablename__ = 'harvests'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    plantation_id = Column(Integer, ForeignKey('plantations.id'), nullable=False, index=True)
    harvest_date = Column(Date, nullable=False)
    num_bunches = Column(Integer, nullable=False)
    weight_per_bunch = Column(Float, nullable=False)  # kg
    ripeness = Column(String(20), nullable=False)  # ripe/unripe

    # Purchase information
    is_purchased = Column(Boolean, default=False)  # True if purchased, False if own harvest
    supplier_name = Column(String(100), nullable=True)  # Supplier name if purchased
    purchase_price = Column(Float, nullable=True)  # Total purchase price in Naira

    # Audit fields
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='harvests')
    plantation = relationship('Plantation', back_populates='harvests')
    milling_records = relationship('Milling', back_populates='harvest')
    creator = relationship('User', foreign_keys=[created_by])
    updater = relationship('User', foreign_keys=[updated_by])

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
            'organization_id': self.organization_id,
            'plantation_id': self.plantation_id,
            'plantation_name': self.plantation.name if self.plantation else None,
            'plantation_code': self.plantation.code if self.plantation else None,
            'harvest_date': self.harvest_date.isoformat(),
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
            'created_by': self.created_by,
            'created_by_username': self.creator.username if self.creator else None,
            'updated_by': self.updated_by,
            'updated_by_username': self.updater.username if self.updater else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Milling(Base):
    """Milling operations records"""
    __tablename__ = 'milling'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    milling_date = Column(Date, nullable=False)
    mill_location = Column(String(50), nullable=False)
    harvest_id = Column(Integer, ForeignKey('harvests.id'))
    milling_cost = Column(Float, nullable=False)  # Naira
    oil_yield = Column(Float, nullable=False)  # kg
    transport_cost = Column(Float, default=0)  # Naira

    # Audit fields
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='millings')
    harvest = relationship('Harvest', back_populates='milling_records')
    storage_records = relationship('Storage', back_populates='milling')
    creator = relationship('User', foreign_keys=[created_by])
    updater = relationship('User', foreign_keys=[updated_by])

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
            'organization_id': self.organization_id,
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
            'created_by': self.created_by,
            'created_by_username': self.creator.username if self.creator else None,
            'updated_by': self.updated_by,
            'updated_by_username': self.updater.username if self.updater else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Storage(Base):
    """CPO Storage inventory"""
    __tablename__ = 'storage'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    container_id = Column(String(50), unique=True, nullable=False)
    milling_id = Column(Integer, ForeignKey('milling.id'))
    quantity = Column(Float, nullable=False)  # kg
    storage_date = Column(Date, nullable=False)
    max_shelf_life_days = Column(Integer, default=config.DEFAULT_SHELF_LIFE_DAYS)
    plantation_source = Column(String(50), nullable=False)
    is_sold = Column(Boolean, default=False)

    # Audit fields
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='storages')
    milling = relationship('Milling', back_populates='storage_records')
    sales_records = relationship('Sale', back_populates='storage')
    creator = relationship('User', foreign_keys=[created_by])
    updater = relationship('User', foreign_keys=[updated_by])

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
            'organization_id': self.organization_id,
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
            'created_by': self.created_by,
            'created_by_username': self.creator.username if self.creator else None,
            'updated_by': self.updated_by,
            'updated_by_username': self.updater.username if self.updater else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Sale(Base):
    """Sales transactions"""
    __tablename__ = 'sales'

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey('buyers.id'), nullable=False, index=True)
    sale_date = Column(Date, nullable=False)
    storage_id = Column(Integer, ForeignKey('storage.id'))
    quantity_sold = Column(Float, nullable=False)  # kg
    price_per_kg = Column(Float, nullable=False)  # Naira
    payment_status = Column(String(20), nullable=False)  # Paid/Pending
    payment_date = Column(Date, nullable=True)

    # Audit fields
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='sales')
    buyer = relationship('Buyer', back_populates='sales')
    storage = relationship('Storage', back_populates='sales_records')
    creator = relationship('User', foreign_keys=[created_by])
    updater = relationship('User', foreign_keys=[updated_by])

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
            'organization_id': self.organization_id,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.company_name if self.buyer else None,
            'buyer_contact': self.buyer.contact_person if self.buyer else None,
            'sale_date': self.sale_date.isoformat(),
            'storage_id': self.storage_id,
            'quantity_sold': self.quantity_sold,
            'quantity_sold_liters': self.quantity_sold_liters,
            'price_per_kg': self.price_per_kg,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'total_revenue': self.total_revenue,
            'is_payment_pending': self.is_payment_pending,
            'created_by': self.created_by,
            'created_by_username': self.creator.username if self.creator else None,
            'updated_by': self.updated_by,
            'updated_by_username': self.updater.username if self.updater else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


def init_db():
    """Initialize the database"""
    engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(engine)
    return engine
