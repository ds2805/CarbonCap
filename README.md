# CarbonCap

A secure carbon credit trading platform with multi-layered fraud protection:
- Credit origin verification with HMAC cryptographic signatures
- Rule-based fraud detection (ownership, double-spend, replay attacks)
- ML anomaly detection using Isolation Forest
- SHA-256 hash chaining for tamper-evident ledger
- Role-based access control (Trader, Verifier, Admin)
- Complete audit trail

## Quick Start

### Backend (Flask)

```bash
# 1. Clone and enter the repo
git clone https://github.com/ds2805/CarbonCap.git
cd CarbonCap

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up your local environment file
cp .env.example .env
# (edit .env if you want a custom SECRET_KEY, etc.)

# 5. Run the backend
python app.py
```

The backend runs at `http://127.0.0.1:5001` (or `http://0.0.0.0:5001` for mobile access).
The SQLite DB is auto-created at `instance/carboncap.db` on first run.

### Mobile App (Expo React Native)

**Requirements:**
- Install [Expo Go](https://expo.dev/go) on your mobile phone
- Make sure your phone and computer are on the same WiFi network

**Steps:**
```bash
# 1. Navigate to mobile app directory
cd CarbonCapMobile

# 2. Install dependencies (first time only)
npm install

# 3. Start the Expo dev server
npx expo start
```

**Connect your phone:**
1. Scan the QR code shown in the terminal with Expo Go app
2. The app will load on your phone
3. Ensure backend is running on your computer first

**Note:** The mobile app's API URL is configured in `src/services/api.ts`. If your computer's IP changes, update the `API_BASE_URL` constant.

## Project Structure

```
carboncap/
├── app.py                      # Flask app entry point
├── config.py                   # Shared configuration
├── models.py                   # SQLAlchemy models
├── auth.py                     # Authentication & RBAC
├── hash_chain.py               # SHA-256 hash chaining
├── verifier_engine.py          # Credit verification & signing
├── fraud_engine.py             # Rule-based fraud detection
├── ml_engine.py                # ML anomaly detection (Isolation Forest)
├── routes/
│   ├── trader.py               # Trader routes
│   ├── verifier.py             # Verifier routes
│   └── admin.py                # Admin routes
├── templates/                  # Web UI templates (basic styling)
├── static/                     # CSS files
├── requirements.txt            # Python dependencies
└── instance/                   # SQLite database (git-ignored)

CarbonCapMobile/                # Expo React Native mobile app
├── src/
│   ├── app/                    # Screens (login, dashboards)
│   ├── components/             # Reusable components
│   ├── services/               # API service layer
│   └── constants/              # Theme & configuration
├── package.json                # Node dependencies
└── app.json                    # Expo configuration
```

## Module Contracts

**verifier_engine.py**
```python
sign_credit(credit) -> (approved: bool, reason: str)
```
Validates credit origin against allowed registries and generates HMAC-SHA256 signature.

**fraud_engine.py**
```python
check_transaction(transaction, credit, sender) -> (is_fraud: bool, reason: str)
```
Performs ownership, double-spend, and replay attack checks.

**ml_engine.py**
```python
anomaly_score(transaction, credit, sender, receiver) -> float
```
Calculates anomaly score using trained Isolation Forest model.

## Current Status

### ✅ Completed (Backend)
- [x] Database models (User, Credit, Transaction, AuditLog)
- [x] Authentication system (register/login/session, password hashing)
- [x] Role-based access control (RBAC decorator)
- [x] Verifier engine with real HMAC signature generation
- [x] Fraud engine with ownership, double-spend, replay checks
- [x] ML engine with Isolation Forest anomaly detection
- [x] Hash chaining for tamper-evident ledger
- [x] All API endpoints and routes
- [x] Audit logging system

### ⚠️ Partially Complete (Frontend)
- [x] Basic web templates (functional but minimal styling)
- [x] Mobile app screens (basic implementation)
- [ ] Improved UI/UX for web dashboards
- [ ] Enhanced mobile app UI and error handling
- [ ] Real-time updates in mobile app

### 📝 Known Limitations
- Web UI has minimal styling - functional but needs improvement
- Mobile app has basic screens but could use better UX
- No real-time notifications for transaction updates
- ML model uses synthetic training data - would benefit from real dataset

## API Reference

### Authentication
| Endpoint | Method | Purpose |
|---|---|---|
| `/register` | POST | Create account (username, password, role) |
| `/login` | POST | Login (username, password) |
| `/logout` | GET | Logout |
| `/api/me` | GET | Get current user info |
| `/api/users` | GET | Get all users (for buyer lookup) |

### Trader Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/trader/dashboard` | GET | Trader dashboard web view |
| `/trader/transactions/new` | POST | Submit transaction (credit_id, receiver_id) |
| `/trader/api/credits` | GET | Get trader's credits (JSON) |
| `/trader/api/transactions` | GET | Get trader's transactions (JSON) |

### Verifier Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/verifier/dashboard` | GET | Verifier dashboard web view |
| `/verifier/credits/new` | POST | Submit new credit for signing (owner_id, origin) |
| `/verifier/credits/<id>/sign` | POST | Sign an unsigned credit |
| `/verifier/api/credits` | GET | Get unsigned/signed credits (JSON) |

### Admin Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/admin/dashboard` | GET | Admin dashboard web view |
| `/admin/users` | GET | Get all users (JSON) |
| `/admin/transactions` | GET | Get all transactions (JSON) |
| `/admin/audit-log` | GET | Get audit log (JSON) |

## Demo Data Setup

To quickly set up demo data for testing:

```bash
source venv/bin/activate
python -c "
from app import create_app
from models import db, User, Credit
from werkzeug.security import generate_password_hash
import verifier_engine

app = create_app()
with app.app_context():
    # Create demo users
    for username, password, role in [
        ('trader1', 'password123', 'Trader'),
        ('trader2', 'password123', 'Trader'),
        ('verifier1', 'password123', 'Verifier'),
        ('admin1', 'password123', 'Admin'),
    ]:
        if not User.query.filter_by(username=username).first():
            user = User(username=username, password_hash=generate_password_hash(password), role=role)
            db.session.add(user)
    
    db.session.commit()
    
    # Create demo credits for trader1
    trader1 = User.query.filter_by(username='trader1').first()
    for origin in ['Verra:VCS-1548-2023', 'Gold Standard:GS-1029-2024']:
        if not Credit.query.filter_by(origin=origin).first():
            credit = Credit(owner_id=trader1.id, origin=origin, signed=False)
            db.session.add(credit)
            db.session.flush()
            approved, _ = verifier_engine.sign_credit(credit)
            if approved:
                credit.signed = True
    
    db.session.commit()
    print('Demo data created!')
"
```

## Testing the System

### Web Interface
1. Start backend: `python app.py`
2. Open browser: `http://127.0.0.1:5001`
3. Register or login with demo accounts
4. Test credit transfers and view dashboards

### Mobile Interface
1. Start backend: `python app.py`
2. Start mobile: `cd CarbonCapMobile && npx expo start`
3. Scan QR code with Expo Go
4. Login and test all features

### Simulation Workflow
1. **Verifier logs in** → views unsigned credits → signs them
2. **Trader1 logs in** → views owned credits → transfers to trader2
3. **Trader2 logs in** → views received credits → transfers back
4. **Admin logs in** → views all transactions, users, audit log

## Future Work

- Enhanced UI/UX for web dashboards
- Improved mobile app with better error handling
- Real-time transaction updates via WebSocket
- Training ML model on real carbon credit transaction data
- Additional fraud detection rules
- Credit marketplace with bidding system
- Integration with real carbon credit registries

## API quick reference

| Endpoint | Method | Role | Purpose |
|---|---|---|---|
| `/register` | GET/POST | any | Create account |
| `/login` | GET/POST | any | Log in |
| `/logout` | GET | logged in | Log out |
| `/trader/dashboard` | GET | Trader | View owned credits + transactions |
| `/trader/transactions/new` | POST | Trader | Submit a transaction (`credit_id`, `receiver_id`) |
| `/verifier/dashboard` | GET | Verifier | View unsigned/signed credits |
| `/verifier/credits/new` | POST | Verifier | Submit a new credit for signing (`owner_id`, `origin`) |
| `/verifier/credits/<id>/sign` | POST | Verifier | Sign an existing unsigned credit |
| `/admin/dashboard` | GET | Admin | Users, transactions, audit log |
| `/admin/users` | GET | Admin | JSON list of users |
| `/admin/transactions` | GET | Admin | JSON list of all transactions |
| `/admin/audit-log` | GET | Admin | JSON audit log |
