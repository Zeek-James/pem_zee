"""
Authentication and Authorization middleware
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.orm import sessionmaker, joinedload
from models import User, Role, Permission, AuditLog
import config
from sqlalchemy import create_engine

# Database session
engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)


def get_current_user():
    """Get current authenticated user from JWT token"""
    user_id = int(get_jwt_identity())  # Convert string to int
    session = Session()
    try:
        # Eagerly load role and permissions to avoid detached instance errors
        user = session.query(User).options(
            joinedload(User.role).joinedload(Role.permissions)
        ).filter(User.id == user_id).first()

        if user:
            # Force load of relationships before session closes
            _ = user.role.name
            _ = user.role.permissions

        return user
    finally:
        session.close()


def auth_required():
    """
    Authentication middleware decorator
    Verifies JWT token and ensures user is active
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()

            if not user:
                return jsonify({'error': 'User not found'}), 401

            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(resource, action):
    """
    Authorization middleware decorator
    Checks if user has required permission for resource and action

    Usage:
        @require_permission('harvest', 'create')
        def create_harvest():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()

            if not user:
                return jsonify({'error': 'User not found'}), 401

            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403

            # Admin role has all permissions
            if user.role.name == 'Admin':
                return fn(*args, **kwargs)

            # Check if user's role has the required permission
            has_permission = False
            for permission in user.role.permissions:
                if permission.resource == resource and permission.action == action:
                    has_permission = True
                    break

            if not has_permission:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required': f'{action} on {resource}'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_role(*allowed_roles):
    """
    Role-based authorization decorator
    Checks if user has one of the allowed roles

    Usage:
        @require_role('Admin', 'Manager')
        def admin_only_function():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()

            if not user:
                return jsonify({'error': 'User not found'}), 401

            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403

            if user.role.name not in allowed_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_roles': list(allowed_roles),
                    'your_role': user.role.name
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ============= AUDIT LOGGING =============

def log_audit(session, user_id, entity_type, entity_id, action, old_values=None, new_values=None):
    """
    Create an audit log entry

    Args:
        session: SQLAlchemy session
        user_id: ID of user performing the action
        entity_type: Type of entity (harvest, milling, storage, sale)
        entity_id: ID of the entity
        action: Action performed (create, update, delete)
        old_values: Dictionary of old values (for update/delete)
        new_values: Dictionary of new values (for create/update)
    """
    try:
        # Get IP address and user agent from request
        ip_address = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent') if request else None

        audit_log = AuditLog(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )

        session.add(audit_log)
        # Note: Don't commit here - let the calling function handle commits

    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Error creating audit log: {e}")


def get_entity_values(entity, exclude_fields=None):
    """
    Extract entity values as dictionary for audit logging

    Args:
        entity: SQLAlchemy model instance
        exclude_fields: List of fields to exclude from audit log

    Returns:
        Dictionary of entity values
    """
    if exclude_fields is None:
        exclude_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    values = {}
    for column in entity.__table__.columns:
        if column.name not in exclude_fields:
            value = getattr(entity, column.name)
            # Convert date/datetime to string for JSON serialization
            if hasattr(value, 'isoformat'):
                values[column.name] = value.isoformat()
            else:
                values[column.name] = value

    return values
