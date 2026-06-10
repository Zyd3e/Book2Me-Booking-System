import os
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User, UserRole, db


def token_required(fn):
    """Decorator to verify JWT token"""
    @wraps(fn)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Unauthorized'}), 401
    return decorated


def role_required(allowed_roles):
    """Decorator to verify user role"""
    def decorator(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user or not user.is_active:
                    return jsonify({'error': 'User not found or inactive'}), 401
                
                # Check if user role is in allowed roles
                if isinstance(allowed_roles, (list, tuple)):
                    user_roles = [allowed_roles] if isinstance(allowed_roles, UserRole) else allowed_roles
                    if user.role not in user_roles:
                        return jsonify({'error': 'Insufficient permissions'}), 403
                else:
                    if user.role != allowed_roles:
                        return jsonify({'error': 'Insufficient permissions'}), 403
                
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': 'Unauthorized'}), 401
        return decorated
    return decorator


def admin_required(fn):
    """Decorator to verify admin role"""
    return role_required([UserRole.ADMIN])(fn)


def hr_required(fn):
    """Decorator to verify HR role"""
    return role_required([UserRole.HR_MANAGER])(fn)


def customer_required(fn):
    """Decorator to verify customer role"""
    return role_required([UserRole.CUSTOMER])(fn)


def get_current_user():
    """Get the current authenticated user"""
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    return User.query.get(current_user_id) if current_user_id else None
