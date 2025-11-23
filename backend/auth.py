"""
Authentication and Authorization middleware
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.orm import sessionmaker
from models import User, Permission
import config
from sqlalchemy import create_engine

# Database session
engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)


def get_current_user():
    """Get current authenticated user from JWT token"""
    user_id = get_jwt_identity()
    session = Session()
    try:
        user = session.query(User).get(user_id)
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
