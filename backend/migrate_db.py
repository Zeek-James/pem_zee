"""
Migrate database to add purchase tracking fields to harvests table
"""

import sqlite3
import os
import config

def migrate_database():
    """Add new columns to harvests table"""
    db_path = config.DATABASE_PATH

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("Please run init_db.py first")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(harvests)")
        columns = [column[1] for column in cursor.fetchall()]

        # Add new columns if they don't exist
        if 'is_purchased' not in columns:
            print("Adding is_purchased column...")
            cursor.execute("ALTER TABLE harvests ADD COLUMN is_purchased BOOLEAN DEFAULT 0")

        if 'supplier_name' not in columns:
            print("Adding supplier_name column...")
            cursor.execute("ALTER TABLE harvests ADD COLUMN supplier_name VARCHAR(100)")

        if 'purchase_price' not in columns:
            print("Adding purchase_price column...")
            cursor.execute("ALTER TABLE harvests ADD COLUMN purchase_price FLOAT")

        conn.commit()
        print("\n✅ Database migrated successfully!")
        print("New columns added:")
        print("  - is_purchased (Boolean)")
        print("  - supplier_name (String)")
        print("  - purchase_price (Float)")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
