# CarbonCap

A secure carbon credit trading platform with multi-layered fraud protection:
- Credit origin verification with HMAC cryptographic signatures
- Rule-based fraud detection (ownership, double-spend, replay attacks)
- ML anomaly detection using Isolation Forest
- SHA-256 hash chaining for tamper-evident ledger
- Role-based access control (Trader, Verifier, Admin)
- Complete audit trail

## Project Status

**Backend: ✅ COMPLETE**
- All fraud detection engines implemented and working
- All API endpoints functional
- Database models complete
- Authentication and authorization working
- Mobile-ready (runs on 0.0.0.0 for phone access)

**Frontend: ⚠️ NEEDS WORK**
- Web UI: Basic HTML templates exist but need styling and UX improvements
- Mobile App: Basic screens exist but need better UI, animations, and step-by-step workflows
- The core functionality works, but the user experience needs to be polished

**What's Missing:**
- Step-by-step visualization of verification process (showing each check)
- Step-by-step visualization of transaction process (showing fraud checks)
- Better credit/buyer selection (dropdowns instead of ID/username inputs)
- Animations and loading states
- Better error handling and success states
- Professional UI design

**See "Frontend Development Guide" section below for detailed requirements.**

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

**Web UI:**
- [x] Basic HTML templates (functional but minimal styling)
- [ ] Enhanced UI with animations and step-by-step workflows
- [ ] Better visual feedback for verification and transaction processes
- [ ] Responsive design improvements

**Mobile App:**
- [x] Basic screens for all roles (login, dashboards)
- [ ] Enhanced UI with animations and progress indicators
- [ ] Step-by-step verification process visualization
- [ ] Step-by-step transaction process visualization
- [ ] Better credit selection (dropdown instead of ID input)
- [ ] Better buyer selection (dropdown with usernames)
- [ ] Loading states and error handling improvements

### 📝 Known Limitations
- Web UI has minimal styling - functional but needs improvement
- Mobile app has basic screens but could use better UX
- No real-time notifications for transaction updates
- ML model uses synthetic training data - would benefit from real dataset

---

## Frontend Development Guide

This section is for developers working on the frontend (web UI and mobile app). The backend is complete and fully functional. Your job is to create a polished, user-friendly interface that clearly shows how the system works.

### Understanding the System Workflows

Before building the UI, you need to understand the two main workflows:

#### **Workflow 1: Credit Verification (Verifier)**

**What happens in the backend:**
1. Verifier receives a credit with an "origin" field (format: "Registry:ProjectID")
2. System checks if the origin matches the expected format
3. System checks if the registry is in the allowed list (Verra, Gold Standard, etc.)
4. System checks if this origin was already used for another signed credit (prevents duplicates)
5. If all checks pass, system generates an HMAC-SHA256 signature
6. Signature is calculated from: credit ID + origin + timestamp + secret key
7. Credit is marked as "signed" and the signature is stored

**What the UI should show:**
- **Step 1**: Display the credit details (ID, Origin, Owner)
- **Step 2**: Show verification checks with animated checkboxes:
  - ✓ Format check (matches "Registry:ProjectID" pattern)
  - ✓ Registry check (is it a recognized registry?)
  - ✓ Duplicate check (has this origin been used before?)
- **Step 3**: Show signature generation animation
- **Step 4**: Display success with the signature hash
- **Error handling**: If any check fails, show which check failed and why

**Mobile app screens needed:**
- Credit details card
- Animated verification checklist
- Success/failure states with clear messaging

#### **Workflow 2: Credit Transaction (Trader)**

**What happens in the backend:**
1. Trader submits a transaction (credit ID, receiver ID)
2. **Fraud Check 1 - Ownership**: Does the sender actually own this credit?
3. **Fraud Check 2 - Double-spend**: Has this credit already been sold in a valid transaction?
4. **Fraud Check 3 - Replay attack**: Has this exact transaction been processed before?
5. **ML Anomaly Check**: Calculate anomaly score using Isolation Forest
6. If ML score ≥ threshold (0.6), flag as suspicious
7. If all checks pass, generate hash chain:
   - Get previous transaction's hash
   - Calculate new hash: transaction data + previous hash
8. Transfer credit ownership
9. Save transaction with status "valid" or "flagged"

**What the UI should show:**
- **Step 1**: Credit selection (dropdown showing available credits with details)
- **Step 2**: Buyer selection (dropdown showing other traders)
- **Step 3**: Show transaction submission
- **Step 4**: Animated fraud detection checks:
  - ✓ Ownership check
  - ✓ Double-spend check
  - ✓ Replay attack check
  - ✓ ML anomaly detection (show the score)
- **Step 5**: Hash chain generation animation
- **Step 6**: Success with transaction details and hash
- **Error handling**: If blocked, show which check failed and the reason

**Mobile app screens needed:**
- Credit selection dropdown (not ID input)
- Buyer selection dropdown (not username input)
- Animated fraud detection checklist
- ML anomaly score visualization (gauge or progress bar)
- Transaction success/failure states

---

### Frontend Requirements

#### **Web UI (templates/)**

**Files to work on:**
- `templates/login.html` - Login page
- `templates/register.html` - Registration page
- `templates/trader_dashboard.html` - Trader dashboard
- `templates/verifier_dashboard.html` - Verifier dashboard
- `templates/admin_dashboard.html` - Admin dashboard
- `templates/base.html` - Base template with navigation
- `static/style.css` - All styling

**Requirements:**
1. **Modern, clean design** with a professional look
2. **Responsive** - works on desktop and mobile browsers
3. **Animated progress indicators** for verification and transaction workflows
4. **Clear error messages** when operations fail
5. **Success states** with confetti or checkmark animations
6. **Credit cards** showing origin, signature status, owner
7. **Transaction cards** showing all details with hash preview
8. **Audit log table** with readable timestamps and details

#### **Mobile App (CarbonCapMobile/)**

**Files to work on:**
- `src/app/login.tsx` - Login screen
- `src/app/register.tsx` - Registration screen
- `src/app/trader-dashboard.tsx` - Trader dashboard
- `src/app/verifier-dashboard.tsx` - Verifier dashboard
- `src/app/admin-dashboard.tsx` - Admin dashboard
- `src/components/` - Create reusable components

**Requirements:**
1. **Credit Selection Component**:
   - Dropdown picker showing available credits
   - Each credit shows: ID, Origin, Signed status
   - Filter by signed/unsigned

2. **User Selection Component**:
   - Dropdown picker showing other users
   - Show username and role
   - Filter by role (e.g., only show Traders)

3. **Verification Checklist Component**:
   - Animated checkboxes for each check
   - Checkboxes turn green as checks pass
   - Show check name and brief description
   - Error state if check fails

4. **Fraud Detection Checklist Component**:
   - Animated checkboxes for fraud checks
   - ML anomaly score gauge (0-1 scale)
   - Color-coded: green (safe), yellow (suspicious), red (blocked)
   - Show threshold line on gauge

5. **Hash Chain Visualization**:
   - Animated chain showing previous hash → new hash
   - Visual representation of tamper evidence
   - Click to see full hash

6. **Loading States**:
   - Skeleton screens while data loads
   - Progress spinners for operations
   - Clear error messages if API fails

7. **Success States**:
   - Confetti animation on successful operations
   - Transaction details card with hash
   - Clear "operation completed" message

---

### API Integration Notes

The mobile app already has API integration in `src/services/api.ts`. All you need to do is:

1. Call the API functions at the right time
2. Show loading states while waiting for response
3. Display success/error states based on response
4. Update local state after successful operations

**Key API functions:**
- `api.login(username, password)` - Returns user object
- `api.register(username, password, role)` - Creates account
- `api.getAllUsers()` - Returns list of users (for buyer selection)
- `api.getTraderCredits()` - Returns trader's credits
- `api.getTraderTransactions()` - Returns trader's transactions
- `api.submitTransaction(creditId, receiverId)` - Submits transaction
- `api.getVerifierCredits()` - Returns unsigned/signed credits
- `api.signCredit(creditId)` - Signs a credit
- `api.getAdminUsers()` - Returns all users
- `api.getAdminTransactions()` - Returns all transactions
- `api.getAuditLog()` - Returns audit log

---

### Design System Recommendations

**Color Palette:**
- Primary: #2e7d32 (green - carbon/eco theme)
- Success: #4caf50
- Warning: #ff9800
- Error: #f44336
- Background: #f5f5f5
- Card background: #ffffff
- Text: #333333

**Typography:**
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Monospace for hashes: Courier or monospace font

**Spacing:**
- Padding: 16px (cards), 8px (tight)
- Margin: 16px between sections
- Border radius: 8-12px

**Animations:**
- Fade in: 300ms
- Slide up: 300ms
- Checkmark animation: 500ms
- Confetti: 1000ms

---

### Testing Checklist

Before considering the frontend complete:

**Trader Dashboard:**
- [ ] Can view owned credits in a nice card layout
- [ ] Can select a credit from dropdown (not ID input)
- [ ] Can select a buyer from dropdown (not username input)
- [ ] Can submit transaction and see animated fraud checks
- [ ] Can see ML anomaly score visualization
- [ ] Can see transaction history with hashes
- [ ] Error states show clear messages

**Verifier Dashboard:**
- [ ] Can view unsigned credits in a nice card layout
- [ ] Can click "Sign" and see animated verification checks
- [ ] Can see signature generation animation
- [ ] Can view signed credits with signature preview
- [ ] Error states show which check failed

**Admin Dashboard:**
- [ ] Can view all users in a nice table
- [ ] Can view all transactions with hashes
- [ ] Can view audit log with readable timestamps
- [ ] Can see hash chain integrity status
- [ ] Can see flagged transactions highlighted

**General:**
- [ ] All screens have loading states
- [ ] All screens have error handling
- [ ] App looks professional and polished
- [ ] Animations are smooth and not distracting
- [ ] Text is readable on all screen sizes

---

## Quick Start for Frontend Developers

If you're starting fresh and only working on the frontend:

### Step 1: Set up the backend
```bash
cd CarbonCap
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Keep this running in one terminal.

### Step 2: Test the current state
- Open http://127.0.0.1:5001 in your browser
- Register accounts or use demo credentials
- See what the current UI looks like
- Try the workflows to understand what needs improvement

### Step 3: Start working on mobile app
```bash
cd CarbonCapMobile
npm install
npx expo start
```
- Scan QR code with Expo Go
- Test all screens
- Start improving the UI

### Step 4: Read the backend code
To understand what the UI should show:
- Read `verifier_engine.py` - understand what checks are done
- Read `fraud_engine.py` - understand fraud detection logic
- Read `ml_engine.py` - understand ML anomaly scoring
- Read `hash_chain.py` - understand hash chaining

### Step 5: Build the UI
Follow the "Frontend Development Guide" section above for detailed requirements.

---

## For the Next Developer

**Your task:** Improve the frontend (web UI and mobile app) to make it professional, user-friendly, and clearly show how the system works.

**What's already done:**
- ✅ Backend is complete and working
- ✅ All fraud detection engines are implemented
- ✅ API endpoints are functional
- ✅ Basic mobile app screens exist
- ✅ Basic web templates exist

**What you need to do:**
1. Read the "Frontend Development Guide" section above
2. Understand the two main workflows (verification and transaction)
3. Design and implement step-by-step visualizations
4. Add animations and loading states
5. Improve user input (dropdowns instead of text inputs)
6. Add error handling and success states
7. Make it look professional

**Important:** Don't change the backend or API contracts. The backend is complete and working. Only modify the frontend files:
- Web: `templates/` and `static/`
- Mobile: `CarbonCapMobile/src/`

**Testing:** Use the demo data setup script in the README to quickly set up test accounts and credits.

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
