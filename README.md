# CarbonCap

Simulation platform for trading carbon credits with layered fraud protection:
a Verifier signing step, rule-based fraud checks, an ML anomaly detector, and
SHA-256 hash chaining for tamper-evidence.

## Setup

```bash
# 1. Clone and enter the repo
git clone https://github.com/ds2805/CarbonCap.git
cd CarbonCap

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up your local environment file
cp .env.example .env
# (edit .env if you want a custom SECRET_KEY, etc.)

# 5. Run the app
python app.py
```

The app runs at `http://127.0.0.1:5000`. The SQLite DB is auto-created at
`instance/carboncap.db` on first run — it's git-ignored, so everyone gets
their own local copy.

## Project structure

```
carboncap/
├── app.py                 # Flask app entry point, blueprint registration
├── config.py               # Shared config (secret key, DB path, ML threshold)
├── models.py                # SQLAlchemy models: User, Credit, Transaction, AuditLog
├── auth.py                  # Login/register/session logic + @require_role RBAC decorator
├── hash_chain.py             # SHA-256 hash chaining helpers
├── verifier_engine.py        # STUB — Mariya owns this (credit origin verification/signing)
├── fraud_engine.py            # STUB — Mariya owns this (double-spend/ownership/replay checks)
├── ml_engine.py                # STUB — Swathy owns this (Isolation Forest anomaly scoring)
├── routes/
│   ├── trader.py                # Trader dashboard + /trader/transactions/new
│   ├── verifier.py               # Verifier dashboard + /verifier/credits/new + sign endpoint
│   └── admin.py                   # Admin dashboard + user/transaction/audit-log views
├── templates/                      # Kavya: fill these in with real styling
├── static/style.css                 # Kavya: replace with real styling
└── requirements.txt
```

## Module contracts (don't change these signatures without a heads-up)

**Mariya — `verifier_engine.py`**
```python
sign_credit(credit) -> (approved: bool, reason: str)
```

**Mariya — `fraud_engine.py`**
```python
check_transaction(transaction, credit, sender) -> (is_fraud: bool, reason: str)
```

**Swathy — `ml_engine.py`**
```python
anomaly_score(transaction, credit, sender, receiver) -> float
```
Compared against `Config.ML_ANOMALY_THRESHOLD` in `routes/trader.py`.

All three files currently contain **working stub logic** (not the real
algorithms) so the full pipeline runs end-to-end already — login → sign a
credit → submit a transaction → hash-chained + saved, or blocked + logged.
Swap the stub bodies out for the real logic; the routes don't need to change.

## Current status

- [x] Repo skeleton
- [x] DB models (User, Credit, Transaction, AuditLog)
- [x] Auth (register/login/session, password hashing)
- [x] RBAC decorator (`@require_role`)
- [x] Stub routes for `/credits/new` and `/transactions/new`, fully wired
      end-to-end with stub engines so Kavya can build dashboards against
      real endpoints right now
- [x] Mariya: replace `verifier_engine.py` and `fraud_engine.py` stubs
- [ ] Swathy: replace `ml_engine.py` stub with trained Isolation Forest
- [ ] Kavya: style `templates/` and `static/`

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
