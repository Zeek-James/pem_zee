# Palm Oil Business Management System

A comprehensive system to manage palm oil business operations including harvesting, milling, storage, sales, and financial tracking.

## Features

### 1. Harvest Tracker
- Record FFB harvests by plantation
- Track bunch weight and ripeness
- Calculate expected CPO yield (OER: 20%)
- Milling alerts for FFB > 24 hours old

### 2. Milling Tracker
- Track milling operations
- Calculate oil yield and costs
- Monitor cost per kg
- Automatic storage creation

### 3. Storage Tracker
- Monitor CPO storage levels
- Track shelf life and expiry (30 days)
- Alert for near-expiry products (5 days)
- View by plantation source

### 4. Sales Tracker
- Record sales transactions
- Track payment status (Paid/Pending)
- Calculate revenue
- Update storage automatically

### 5. Financial Dashboard
- View profit trends (charts)
- Analyze cost breakdown
- Monitor ROI and KPIs
- Export Excel/PDF reports

### 6. Notifications & Alerts
- FFB milling reminders (24h threshold)
- Storage expiry warnings (5 days)
- Payment pending alerts
- Low stock notifications (< 50kg)

## Technology Stack

- **Backend**: Flask (Python) with SQLAlchemy ORM
- **Database**: SQLite (easily upgradable to PostgreSQL)
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Reports**: openpyxl (Excel), ReportLab (PDF)

## Quick Start

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed instructions.

### Backend (Terminal 1)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python load_sample_data.py
python app.py
```

Backend runs on: **http://localhost:5000**

### Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:3000**

## Project Structure

```
pem_zee/
├── backend/
│   ├── app.py              # Flask API server
│   ├── models.py           # Database models
│   ├── config.py           # Configuration
│   ├── reports.py          # Report generation
│   ├── init_db.py          # Database initialization
│   ├── load_sample_data.py # Sample data loader
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Dashboard
│   │   ├── harvest/        # Harvest module
│   │   ├── milling/        # Milling module
│   │   ├── storage/        # Storage module
│   │   ├── sales/          # Sales module
│   │   └── alerts/         # Alerts module
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── Navigation.tsx  # Nav component
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   └── utils.ts        # Utilities
│   └── package.json        # Node dependencies
├── reports/                # Generated reports
├── README.md              # This file
└── SETUP_GUIDE.md        # Detailed setup instructions
```

## Key Calculations

- **Expected Oil Yield** = FFB Weight × OER% (20%)
- **Cost per kg** = (FFB cost + Milling + Transport) / Oil yield
- **Profit per batch** = Revenue - Total cost
- **FFB cost** = Total weight × ₦50/kg (configurable)

## API Endpoints

Full API documentation in [SETUP_GUIDE.md](./SETUP_GUIDE.md#api-endpoints)

- `/api/harvests` - Harvest management
- `/api/milling` - Milling operations
- `/api/storage` - Storage inventory
- `/api/sales` - Sales transactions
- `/api/dashboard` - Analytics & KPIs
- `/api/reports` - Excel/PDF export

## Configuration

Edit `backend/config.py`:

```python
OER_PERCENTAGE = 0.20           # Oil Extraction Rate
DEFAULT_SHELF_LIFE_DAYS = 30    # CPO shelf life
MILLING_ALERT_HOURS = 24        # Milling alert threshold
STORAGE_EXPIRY_WARNING_DAYS = 5 # Expiry warning days
LOW_STOCK_THRESHOLD_KG = 50     # Low stock alert
PLANTATIONS = ['Owerri', 'Aba'] # Your plantations
```

## Sample Data

The system comes with sample data:

- **4 Harvest records** (Owerri & Aba plantations)
- **3 Milling operations** (with oil yields)
- **3 Storage containers** (CPO inventory)
- **2 Sales transactions** (1 paid, 1 pending)

Load with: `python backend/load_sample_data.py`

## Reports

Generate business reports:

1. **Summary Report** - All modules overview
2. **Harvest Report** - FFB harvest details
3. **Milling Report** - Production data
4. **Storage Report** - Inventory status
5. **Sales Report** - Transaction history

Formats: Excel (.xlsx) and PDF

## Screenshots & Demo

Access the dashboard at http://localhost:3000 to see:

- ✅ Key performance indicators (KPIs)
- ✅ Interactive profit trend charts
- ✅ Real-time alerts and notifications
- ✅ Inventory management
- ✅ Sales tracking with payment status

## Extending the System

Ideas for enhancement:

1. **User Authentication** - Add login/roles
2. **Multi-tenant** - Support multiple businesses
3. **Forecasting** - Predict oil production
4. **Mobile App** - React Native version
5. **Advanced Analytics** - ML-powered insights
6. **Procurement** - Track FFB purchases
7. **Logistics** - Delivery management
8. **Quality Control** - Oil quality tracking

## Troubleshooting

Common issues and solutions in [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)

## License

MIT License

## Support

For detailed setup and usage instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
