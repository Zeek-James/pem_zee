"""
Load sample data for testing the Palm Oil Business Management System
"""

from datetime import date, timedelta
from sqlalchemy.orm import sessionmaker
from models import init_db, Harvest, Milling, Storage, Sale

# Initialize database
engine = init_db()
Session = sessionmaker(bind=engine)
session = Session()


def load_sample_data():
    """Load sample data based on requirements"""

    print("Loading sample data...")

    # Clear existing data
    session.query(Sale).delete()
    session.query(Storage).delete()
    session.query(Milling).delete()
    session.query(Harvest).delete()
    session.commit()

    # Sample Harvests
    harvests_data = [
        {'harvest_date': date(2025, 11, 21), 'plantation': 'Owerri', 'num_bunches': 10, 'weight_per_bunch': 16, 'ripeness': 'Ripe'},
        {'harvest_date': date(2025, 11, 21), 'plantation': 'Aba', 'num_bunches': 5, 'weight_per_bunch': 15, 'ripeness': 'Ripe'},
        {'harvest_date': date(2025, 11, 20), 'plantation': 'Owerri', 'num_bunches': 8, 'weight_per_bunch': 17, 'ripeness': 'Ripe'},
        {'harvest_date': date(2025, 11, 19), 'plantation': 'Aba', 'num_bunches': 12, 'weight_per_bunch': 15, 'ripeness': 'Ripe'},
    ]

    harvests = []
    for data in harvests_data:
        harvest = Harvest(**data)
        session.add(harvest)
        harvests.append(harvest)

    session.commit()
    print(f"Created {len(harvests)} harvest records")

    # Sample Milling
    milling_data = [
        {
            'milling_date': date(2025, 11, 22),
            'mill_location': 'Aba Mill',
            'harvest_id': harvests[0].id,
            'milling_cost': 15000,
            'oil_yield': 32,
            'transport_cost': 2000
        },
        {
            'milling_date': date(2025, 11, 22),
            'mill_location': 'Owerri Mill',
            'harvest_id': harvests[1].id,
            'milling_cost': 7500,
            'oil_yield': 15,
            'transport_cost': 1500
        },
        {
            'milling_date': date(2025, 11, 21),
            'mill_location': 'Owerri Mill',
            'harvest_id': harvests[2].id,
            'milling_cost': 13000,
            'oil_yield': 27,
            'transport_cost': 1800
        }
    ]

    milling_records = []
    for data in milling_data:
        milling = Milling(**data)
        session.add(milling)
        milling_records.append(milling)

    session.commit()
    print(f"Created {len(milling_records)} milling records")

    # Sample Storage (auto-created with milling, but let's add manually for clarity)
    storage_data = [
        {
            'container_id': 'CPO001',
            'milling_id': milling_records[0].id,
            'quantity': 32,
            'storage_date': date(2025, 11, 22),
            'plantation_source': 'Owerri',
            'is_sold': False
        },
        {
            'container_id': 'CPO002',
            'milling_id': milling_records[1].id,
            'quantity': 15,
            'storage_date': date(2025, 11, 22),
            'plantation_source': 'Aba',
            'is_sold': False
        },
        {
            'container_id': 'CPO003',
            'milling_id': milling_records[2].id,
            'quantity': 27,
            'storage_date': date(2025, 11, 21),
            'plantation_source': 'Owerri',
            'is_sold': False
        }
    ]

    storage_records = []
    for data in storage_data:
        storage = Storage(**data)
        session.add(storage)
        storage_records.append(storage)

    session.commit()
    print(f"Created {len(storage_records)} storage records")

    # Sample Sales
    sales_data = [
        {
            'sale_date': date(2025, 11, 23),
            'buyer_name': 'Trader A',
            'storage_id': storage_records[0].id,
            'quantity_sold': 32,
            'price_per_kg': 1000,
            'payment_status': 'Paid',
            'payment_date': date(2025, 11, 23)
        },
        {
            'sale_date': date(2025, 11, 23),
            'buyer_name': 'Trader B',
            'storage_id': storage_records[1].id,
            'quantity_sold': 15,
            'price_per_kg': 1000,
            'payment_status': 'Pending',
            'payment_date': None
        }
    ]

    sales = []
    for data in sales_data:
        sale = Sale(**data)
        session.add(sale)
        sales.append(sale)

        # Mark storage as sold
        storage = session.query(Storage).get(data['storage_id'])
        storage.is_sold = True

    session.commit()
    print(f"Created {len(sales)} sales records")

    print("\nSample data loaded successfully!")
    print("\nSummary:")
    print(f"  - Harvests: {len(harvests)}")
    print(f"  - Milling Operations: {len(milling_records)}")
    print(f"  - Storage Containers: {len(storage_records)}")
    print(f"  - Sales Transactions: {len(sales)}")

    # Display some statistics
    total_ffb = sum(h.total_weight for h in harvests)
    total_oil = sum(m.oil_yield for m in milling_records)
    total_cost = sum(m.total_cost for m in milling_records)
    total_revenue = sum(s.total_revenue for s in sales)

    print(f"\nBusiness Statistics:")
    print(f"  - Total FFB Harvested: {total_ffb} kg")
    print(f"  - Total CPO Produced: {total_oil} kg")
    print(f"  - Total Production Cost: ₦{total_cost:,.2f}")
    print(f"  - Total Revenue: ₦{total_revenue:,.2f}")
    print(f"  - Total Profit: ₦{(total_revenue - total_cost):,.2f}")

    session.close()


if __name__ == '__main__':
    load_sample_data()
