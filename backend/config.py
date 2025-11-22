"""
Configuration file for Palm Oil Business Management System
"""

import os

# Database Configuration
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
PORT = 5001
DEBUG = True

# Report Configuration
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
