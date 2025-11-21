"""
Initialize the database for Palm Oil Business Management System
"""

from models import init_db

if __name__ == '__main__':
    engine = init_db()
    print("Database initialized successfully!")
    print(f"Database location: {engine.url}")
