"""
Configuration file for Palm Oil Business Management System
"""

import os

# Database Configuration
# Use PostgreSQL in production, SQLite in development
if os.getenv('DATABASE_URL'):
    # Production database (PostgreSQL from environment)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    # Fix for Heroku postgres:// -> postgresql://
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
else:
    # Development database (SQLite)
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'palm_oil.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'

# Business Configuration
OER_PERCENTAGE = 0.20  # Oil Extraction Rate (20%)
DEFAULT_SHELF_LIFE_DAYS = 30  # CPO shelf life in days
MILLING_ALERT_HOURS = 24  # Alert if FFB not milled within 24 hours
CPO_DENSITY = 0.91  # CPO density in kg/liter (for volume conversion)

# Alert Thresholds
STORAGE_EXPIRY_WARNING_DAYS = 5  # Warn when CPO has 5 days until expiry
LOW_STOCK_THRESHOLD_KG = 50  # Alert when storage below 50kg

# Plantations
PLANTATIONS = ['Owerri', 'Aba']

# API Configuration
API_PREFIX = '/api'
HOST = '0.0.0.0'
PORT = int(os.getenv('PORT', 5001))  # Use PORT from environment in production
DEBUG = os.getenv('FLASK_ENV') != 'production'  # Disable debug in production

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')  # Change in production!
JWT_ACCESS_TOKEN_EXPIRES = 3600 * 24  # 24 hours in seconds
JWT_REFRESH_TOKEN_EXPIRES = 3600 * 24 * 30  # 30 days in seconds

# Report Configuration
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
