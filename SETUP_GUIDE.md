# Palm Oil Business Management System - Setup Guide

## Quick Start

Follow these steps to get your Palm Oil Management System up and running.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and npm installed
- Basic command line knowledge

## Step 1: Backend Setup

### 1.1 Navigate to Backend Directory

```bash
cd backend
```

### 1.2 Create Virtual Environment

```bash
python -m venv venv
```

### 1.3 Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 1.4 Install Dependencies

```bash
pip install -r requirements.txt
```

### 1.5 Initialize Database

```bash
python init_db.py
```

You should see: "Database initialized successfully!"

### 1.6 Load Sample Data (Optional but Recommended)

```bash
python load_sample_data.py
```

This creates sample harvests, milling operations, storage, and sales records.

### 1.7 Start Backend Server

```bash
python app.py
```

The backend will run on: **http://localhost:5000**

Keep this terminal window open!

## Step 2: Frontend Setup

Open a **new terminal window** and follow these steps:

### 2.1 Navigate to Frontend Directory

```bash
cd frontend
```

### 2.2 Install Dependencies

```bash
npm install
```

This may take a few minutes.

### 2.3 Start Development Server

```bash
npm run dev
```

The frontend will run on: **http://localhost:3000**

## Step 3: Access the Application

Open your web browser and go to:

**http://localhost:3000**

You should see the Dashboard with sample data!

## System Features

### 1. Dashboard
- View key metrics (oil produced, revenue, profit, costs)
- Profit trends charts
- Cost vs Revenue comparison
- Export Excel/PDF reports

### 2. Harvest Tracker
- Record new FFB harvests
- Track by plantation (Owerri/Aba)
- Monitor bunch count and weight
- Calculate expected oil yield
- Milling alerts for old harvests

### 3. Milling Operations
- Record milling operations
- Track oil yield per batch
- Calculate cost per kg
- Monitor total costs

### 4. Storage Management
- Monitor CPO inventory
- Track expiry dates
- View storage by plantation source
- Get alerts for near-expiry items

### 5. Sales Tracker
- Record sales transactions
- Track buyer information
- Monitor payment status
- Calculate total revenue

### 6. Alerts & Notifications
- Milling reminders (FFB > 24 hours old)
- Storage expiry warnings
- Payment pending alerts
- Low stock notifications

## Working with the System

### Adding a New Harvest

1. Go to **Harvest** page
2. Click "New Harvest" button
3. Fill in:
   - Harvest date
   - Plantation (Owerri or Aba)
   - Number of bunches
   - Weight per bunch (kg)
   - Ripeness (Ripe/Unripe)
4. Click "Save Harvest"

**Expected oil yield is calculated automatically** (FFB weight × 20% OER)

### Recording Milling

Milling records are created via the backend API. You can:

1. Use the backend API directly:
```bash
curl -X POST http://localhost:5000/api/milling \
  -H "Content-Type: application/json" \
  -d '{
    "milling_date": "2025-11-21",
    "mill_location": "Owerri Mill",
    "harvest_id": 1,
    "milling_cost": 15000,
    "oil_yield": 32,
    "transport_cost": 2000
  }'
```

2. Or extend the frontend to add a milling form (similar to harvest)

### Recording Sales

Sales can be recorded via API:

```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "sale_date": "2025-11-23",
    "buyer_name": "Trader A",
    "storage_id": 1,
    "quantity_sold": 32,
    "price_per_kg": 1000,
    "payment_status": "Paid"
  }'
```

### Generating Reports

From the Dashboard:

1. Click "Excel Report" to download Excel file
2. Click "PDF Report" to download PDF file

Reports include:
- Summary of all operations
- Harvest records
- Milling operations
- Storage inventory
- Sales transactions

## Configuration

### Backend Configuration

Edit `backend/config.py` to customize:

```python
OER_PERCENTAGE = 0.20  # Oil Extraction Rate (20%)
DEFAULT_SHELF_LIFE_DAYS = 30  # CPO shelf life
MILLING_ALERT_HOURS = 24  # Alert threshold
STORAGE_EXPIRY_WARNING_DAYS = 5  # Expiry warning
LOW_STOCK_THRESHOLD_KG = 50  # Low stock alert
```

### Plantations

Add or modify plantations in `backend/config.py`:

```python
PLANTATIONS = ['Owerri', 'Aba', 'Your Location']
```

## Database Management

### View Database

The database is stored in `backend/palm_oil.db` (SQLite)

You can view it with any SQLite browser or:

```bash
sqlite3 backend/palm_oil.db
.tables  # List tables
SELECT * FROM harvests;  # Query data
```

### Reset Database

To start fresh:

```bash
rm backend/palm_oil.db
python backend/init_db.py
python backend/load_sample_data.py
```

## API Endpoints

### Harvest
- `GET /api/harvests` - Get all harvests
- `POST /api/harvests` - Create harvest
- `GET /api/harvests/<id>` - Get specific harvest

### Milling
- `GET /api/milling` - Get all milling records
- `POST /api/milling` - Create milling record

### Storage
- `GET /api/storage` - Get all storage
- `GET /api/storage/available` - Get available inventory
- `GET /api/storage/alerts` - Get expiry alerts

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `PATCH /api/sales/<id>/payment` - Update payment status

### Dashboard
- `GET /api/dashboard/summary` - Get business summary
- `GET /api/dashboard/profit-trends` - Get profit trends
- `GET /api/dashboard/alerts` - Get all alerts

### Reports
- `GET /api/reports/excel?type=summary` - Download Excel report
- `GET /api/reports/pdf?type=summary` - Download PDF report

## Troubleshooting

### Backend Issues

**Problem:** "Module not found" error

**Solution:** Make sure you activated the virtual environment and installed dependencies:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Problem:** "Address already in use"

**Solution:** Port 5000 is taken. Change the port in `backend/config.py`:
```python
PORT = 5001  # Or any other available port
```

### Frontend Issues

**Problem:** "Module not found" or build errors

**Solution:** Delete node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem:** "Failed to fetch" errors

**Solution:** Make sure:
1. Backend is running on http://localhost:5000
2. Check `.env.local` has correct API URL
3. No CORS issues (Flask-CORS is installed)

## Production Deployment

### Backend

1. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

2. Use PostgreSQL instead of SQLite for better performance
3. Set `DEBUG = False` in config.py
4. Use environment variables for sensitive data

### Frontend

1. Build the production version:
```bash
npm run build
npm run start
```

2. Deploy to Vercel, Netlify, or your server
3. Update `NEXT_PUBLIC_API_URL` to your backend URL

## Support

For issues or questions:
- Check the API documentation above
- Review sample data structure in `load_sample_data.py`
- Inspect database with SQLite browser
- Check backend logs in terminal

## Next Steps

1. **Customize calculations:** Edit OER percentage and costs in config.py
2. **Add more plantations:** Update PLANTATIONS list
3. **Extend features:** Add forecasting, inventory planning, or mobile support
4. **Multi-user support:** Add authentication and user roles
5. **Advanced reporting:** Create custom report templates
6. **Mobile app:** Build React Native version using same backend API

Enjoy managing your palm oil business!
