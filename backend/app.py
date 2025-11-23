"""
Flask API for Palm Oil Business Management System
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date
import config
from models import Base, Harvest, Milling, Storage, Sale, User, Role, Permission
from reports import ReportGenerator

# Initialize Flask app
app = Flask(__name__)

# CORS Configuration
# Update the Vercel URL after deployment
allowed_origins = [
    'http://localhost:3000',  # Development
    'https://pem-zee.vercel.app',  # Production (UPDATE THIS with your actual Vercel URL)
    'https://pem-zee-*.vercel.app',  # Vercel preview deployments
]
CORS(app, origins=allowed_origins, supports_credentials=True)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
jwt = JWTManager(app)

# Database setup
engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)

# Initialize report generator
report_gen = ReportGenerator()

# Initialize database tables (critical for production)
try:
    Base.metadata.create_all(engine)
    print("Database tables initialized successfully")
except Exception as e:
    print(f"Warning: Could not initialize database tables: {e}")


def get_session():
    """Get database session"""
    return Session()


# ============= HARVEST ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/harvests', methods=['GET'])
def get_harvests():
    """Get all harvest records"""
    session = get_session()
    try:
        harvests = session.query(Harvest).order_by(Harvest.harvest_date.desc()).all()
        return jsonify([h.to_dict() for h in harvests])
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/harvests/<int:id>', methods=['GET'])
def get_harvest(id):
    """Get specific harvest record"""
    session = get_session()
    try:
        harvest = session.query(Harvest).get(id)
        if not harvest:
            return jsonify({'error': 'Harvest not found'}), 404
        return jsonify(harvest.to_dict())
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/harvests', methods=['POST'])
def create_harvest():
    """Create new harvest record"""
    session = get_session()
    try:
        data = request.json

        harvest = Harvest(
            harvest_date=datetime.strptime(data['harvest_date'], '%Y-%m-%d').date(),
            plantation=data['plantation'],
            num_bunches=data['num_bunches'],
            weight_per_bunch=data['weight_per_bunch'],
            ripeness=data['ripeness'],
            is_purchased=data.get('is_purchased', False),
            supplier_name=data.get('supplier_name'),
            purchase_price=data.get('purchase_price')
        )

        session.add(harvest)
        session.commit()

        return jsonify(harvest.to_dict()), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


# ============= MILLING ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/milling', methods=['GET'])
def get_milling():
    """Get all milling records"""
    session = get_session()
    try:
        milling_records = session.query(Milling).order_by(Milling.milling_date.desc()).all()
        return jsonify([m.to_dict() for m in milling_records])
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/milling/<int:id>', methods=['GET'])
def get_milling_record(id):
    """Get specific milling record"""
    session = get_session()
    try:
        milling = session.query(Milling).get(id)
        if not milling:
            return jsonify({'error': 'Milling record not found'}), 404
        return jsonify(milling.to_dict())
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/milling', methods=['POST'])
def create_milling():
    """Create new milling record and add to storage"""
    session = get_session()
    try:
        data = request.json

        # Create milling record
        milling = Milling(
            milling_date=datetime.strptime(data['milling_date'], '%Y-%m-%d').date(),
            mill_location=data['mill_location'],
            harvest_id=data.get('harvest_id'),
            milling_cost=data['milling_cost'],
            oil_yield=data['oil_yield'],
            transport_cost=data.get('transport_cost', 0)
        )

        session.add(milling)
        session.flush()  # Get the milling ID

        # Automatically create storage record
        harvest = session.query(Harvest).get(data.get('harvest_id')) if data.get('harvest_id') else None
        plantation_source = harvest.plantation if harvest else data.get('plantation_source', 'Unknown')

        # Generate container ID
        container_id = f"CPO{str(milling.id).zfill(3)}"

        storage = Storage(
            container_id=container_id,
            milling_id=milling.id,
            quantity=milling.oil_yield,
            storage_date=milling.milling_date,
            plantation_source=plantation_source
        )

        session.add(storage)
        session.commit()

        return jsonify({
            'milling': milling.to_dict(),
            'storage': storage.to_dict()
        }), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


# ============= STORAGE ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/storage', methods=['GET'])
def get_storage():
    """Get all storage inventory"""
    session = get_session()
    try:
        storage_records = session.query(Storage).order_by(Storage.storage_date.desc()).all()
        return jsonify([s.to_dict() for s in storage_records])
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/storage/available', methods=['GET'])
def get_available_storage():
    """Get available (not fully sold) storage inventory with remaining quantities"""
    session = get_session()
    try:
        # Get all storage records (not fully sold)
        storage_records = session.query(Storage).filter_by(is_sold=False).all()

        # Filter to only include containers with remaining quantity
        available_records = [s for s in storage_records if s.remaining_quantity > 0]

        # Calculate total remaining quantity
        total_remaining = sum(s.remaining_quantity for s in available_records)

        return jsonify({
            'inventory': [s.to_dict() for s in available_records],
            'total_quantity': total_remaining
        })
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/storage/alerts', methods=['GET'])
def get_storage_alerts():
    """Get storage alerts (near expiry, expired)"""
    session = get_session()
    try:
        storage_records = session.query(Storage).filter_by(is_sold=False).all()

        near_expiry = [s.to_dict() for s in storage_records if s.is_near_expiry]
        expired = [s.to_dict() for s in storage_records if s.is_expired]

        return jsonify({
            'near_expiry': near_expiry,
            'expired': expired,
            'total_alerts': len(near_expiry) + len(expired)
        })
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/storage/<int:id>', methods=['GET'])
def get_storage_record(id):
    """Get specific storage record"""
    session = get_session()
    try:
        storage = session.query(Storage).get(id)
        if not storage:
            return jsonify({'error': 'Storage record not found'}), 404
        return jsonify(storage.to_dict())
    finally:
        session.close()


# ============= SALES ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/sales', methods=['GET'])
def get_sales():
    """Get all sales records"""
    session = get_session()
    try:
        sales = session.query(Sale).order_by(Sale.sale_date.desc()).all()
        return jsonify([s.to_dict() for s in sales])
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/sales/<int:id>', methods=['GET'])
def get_sale(id):
    """Get specific sale record"""
    session = get_session()
    try:
        sale = session.query(Sale).get(id)
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        return jsonify(sale.to_dict())
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/sales', methods=['POST'])
def create_sale():
    """Create new sale record and update storage"""
    session = get_session()
    try:
        data = request.json

        # Get storage record
        storage = session.query(Storage).get(data['storage_id'])
        if not storage:
            return jsonify({'error': 'Storage record not found'}), 404

        # Check remaining quantity
        remaining = storage.remaining_quantity
        quantity_to_sell = data['quantity_sold']

        if remaining <= 0:
            return jsonify({'error': 'This storage container is empty (all quantity sold)'}), 400

        if quantity_to_sell > remaining:
            return jsonify({
                'error': f'Cannot sell {quantity_to_sell}kg. Only {remaining:.2f}kg available in this container.'
            }), 400

        # Create sale record
        sale = Sale(
            sale_date=datetime.strptime(data['sale_date'], '%Y-%m-%d').date(),
            buyer_name=data['buyer_name'],
            storage_id=data['storage_id'],
            quantity_sold=quantity_to_sell,
            price_per_kg=data['price_per_kg'],
            payment_status=data['payment_status'],
            payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else None
        )

        session.add(sale)
        session.flush()  # Flush to update storage.remaining_quantity calculation

        # Mark as sold only if all quantity is sold
        new_remaining = storage.remaining_quantity
        if new_remaining <= 0:
            storage.is_sold = True

        session.commit()

        return jsonify({
            'sale': sale.to_dict(),
            'storage_remaining': new_remaining,
            'container_fully_sold': storage.is_sold
        }), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/sales/<int:id>/payment', methods=['PATCH'])
def update_payment_status(id):
    """Update payment status for a sale"""
    session = get_session()
    try:
        sale = session.query(Sale).get(id)
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404

        data = request.json
        sale.payment_status = data['payment_status']
        if data.get('payment_date'):
            sale.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date()

        session.commit()
        return jsonify(sale.to_dict())
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


# ============= DASHBOARD ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get financial summary and KPIs"""
    session = get_session()
    try:
        # Get all records
        harvests = session.query(Harvest).all()
        milling_records = session.query(Milling).all()
        sales = session.query(Sale).all()
        storage_records = session.query(Storage).filter_by(is_sold=False).all()

        # Calculate totals
        total_ffb_weight = sum(h.total_weight for h in harvests)
        total_milling_cost = sum(m.total_cost for m in milling_records)
        total_oil_produced = sum(m.oil_yield for m in milling_records)
        total_revenue = sum(s.total_revenue for s in sales)
        # Use remaining_quantity to show actual available stock (not original quantity)
        total_storage = sum(s.remaining_quantity for s in storage_records)

        # Calculate profit
        total_profit = total_revenue - total_milling_cost

        # Payment tracking
        pending_payments = [s for s in sales if s.is_payment_pending]
        total_pending_amount = sum(s.total_revenue for s in pending_payments)

        return jsonify({
            'total_ffb_harvested': total_ffb_weight,
            'total_oil_produced': total_oil_produced,
            'total_milling_cost': total_milling_cost,
            'total_revenue': total_revenue,
            'total_profit': total_profit,
            'total_storage': total_storage,
            'pending_payments_count': len(pending_payments),
            'total_pending_amount': total_pending_amount,
            'average_oil_yield': total_oil_produced / len(milling_records) if milling_records else 0
        })
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/dashboard/profit-trends', methods=['GET'])
def get_profit_trends():
    """Get profit trends over time"""
    session = get_session()
    try:
        sales = session.query(Sale).order_by(Sale.sale_date).all()
        milling_records = session.query(Milling).order_by(Milling.milling_date).all()

        # Group by date
        trends = {}

        # Add costs
        for m in milling_records:
            date_str = m.milling_date.isoformat()
            if date_str not in trends:
                trends[date_str] = {'date': date_str, 'cost': 0, 'revenue': 0, 'profit': 0}
            trends[date_str]['cost'] += m.total_cost

        # Add revenue
        for s in sales:
            date_str = s.sale_date.isoformat()
            if date_str not in trends:
                trends[date_str] = {'date': date_str, 'cost': 0, 'revenue': 0, 'profit': 0}
            trends[date_str]['revenue'] += s.total_revenue

        # Calculate profit
        for date_str in trends:
            trends[date_str]['profit'] = trends[date_str]['revenue'] - trends[date_str]['cost']

        return jsonify(sorted(trends.values(), key=lambda x: x['date']))
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/dashboard/alerts', methods=['GET'])
def get_all_alerts():
    """Get all alerts (milling, storage, payments)"""
    session = get_session()
    try:
        alerts = []

        # Milling alerts
        harvests = session.query(Harvest).all()
        for h in harvests:
            if h.needs_milling_alert:
                # Check if already milled
                milled = session.query(Milling).filter_by(harvest_id=h.id).first()
                if not milled:
                    alerts.append({
                        'type': 'milling',
                        'severity': 'high',
                        'message': f'FFB from {h.plantation} harvested on {h.harvest_date} needs milling',
                        'harvest_id': h.id
                    })

        # Storage alerts
        storage_records = session.query(Storage).filter_by(is_sold=False).all()
        for s in storage_records:
            if s.is_expired:
                alerts.append({
                    'type': 'storage',
                    'severity': 'critical',
                    'message': f'Container {s.container_id} has expired!',
                    'storage_id': s.id
                })
            elif s.is_near_expiry:
                alerts.append({
                    'type': 'storage',
                    'severity': 'medium',
                    'message': f'Container {s.container_id} expires in {s.days_until_expiry} days',
                    'storage_id': s.id
                })

        # Low stock alert
        total_storage = sum(s.quantity for s in storage_records)
        if total_storage < config.LOW_STOCK_THRESHOLD_KG:
            alerts.append({
                'type': 'stock',
                'severity': 'medium',
                'message': f'Low stock: Only {total_storage:.2f}kg CPO in storage',
                'current_stock': total_storage
            })

        # Payment alerts
        pending_sales = session.query(Sale).filter_by(payment_status='Pending').all()
        for s in pending_sales:
            alerts.append({
                'type': 'payment',
                'severity': 'low',
                'message': f'Payment pending from {s.buyer_name} for ₦{s.total_revenue:,.2f}',
                'sale_id': s.id
            })

        return jsonify({
            'alerts': alerts,
            'total_count': len(alerts)
        })
    finally:
        session.close()


# ============= REPORT ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/reports/excel', methods=['GET'])
def generate_excel_report():
    """Generate Excel report"""
    session = get_session()
    try:
        report_type = request.args.get('type', 'summary')

        harvests = session.query(Harvest).all()
        milling_records = session.query(Milling).all()
        storage_records = session.query(Storage).all()
        sales = session.query(Sale).all()

        filepath = report_gen.generate_excel_report(
            harvests, milling_records, storage_records, sales, report_type
        )

        return send_file(filepath, as_attachment=True)
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/reports/pdf', methods=['GET'])
def generate_pdf_report():
    """Generate PDF report"""
    session = get_session()
    try:
        report_type = request.args.get('type', 'summary')

        harvests = session.query(Harvest).all()
        milling_records = session.query(Milling).all()
        storage_records = session.query(Storage).all()
        sales = session.query(Sale).all()

        filepath = report_gen.generate_pdf_report(
            harvests, milling_records, storage_records, sales, report_type
        )

        return send_file(filepath, as_attachment=True)
    finally:
        session.close()


# ============= AUTHENTICATION ENDPOINTS =============

@app.route(f'{config.API_PREFIX}/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    session = get_session()
    try:
        data = request.json

        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name', 'role_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check if username already exists
        existing_user = session.query(User).filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 409

        # Check if email already exists
        existing_email = session.query(User).filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 409

        # Validate role exists
        role = session.query(Role).get(data['role_id'])
        if not role:
            return jsonify({'error': 'Invalid role_id'}), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role_id=data['role_id']
        )
        user.set_password(data['password'])  # Hash password

        session.add(user)
        session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/auth/login', methods=['POST'])
def login():
    """Login user and return JWT tokens"""
    session = get_session()
    try:
        data = request.json

        # Validate required fields
        if 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Username and password required'}), 400

        # Find user
        user = session.query(User).filter_by(username=data['username']).first()

        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403

        # Verify password
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        session.commit()

        # Create JWT tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role.name,
                'role_id': user.role_id
            }
        )
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token deletion)"""
    return jsonify({'message': 'Logout successful'}), 200


@app.route(f'{config.API_PREFIX}/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    current_user_id = get_jwt_identity()
    session = get_session()

    try:
        user = session.query(User).get(current_user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        new_access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role.name,
                'role_id': user.role_id
            }
        )

        return jsonify({
            'access_token': new_access_token
        }), 200
    finally:
        session.close()


@app.route(f'{config.API_PREFIX}/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current logged-in user info"""
    current_user_id = get_jwt_identity()
    session = get_session()

    try:
        user = session.query(User).get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict()), 200
    finally:
        session.close()


# ============= HEALTH CHECK =============

@app.route(f'{config.API_PREFIX}/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })


if __name__ == '__main__':
    # Initialize database
    Base.metadata.create_all(engine)
    print(f"Server running on http://{config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
