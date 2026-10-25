"""
CarbonCap — Fresh Machine Initialization Script
Runs on fresh setup to generate model.pkl (if missing) and seed demo database.
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from werkzeug.security import generate_password_hash

from app import create_app
from models import db, User, Credit
import verifier_engine

def init_model():
    if not os.path.exists('model.pkl'):
        print("Training baseline Isolation Forest model (model.pkl)...")
        np.random.seed(42)
        n_normal = 2000
        normal_amount = np.random.exponential(scale=50, size=n_normal) + 5
        normal_hour = np.random.randint(8, 18, size=n_normal)
        normal_tx_count = np.random.randint(5, 50, size=n_normal)
        normal_amount_ratio = np.random.normal(0, 0.2, size=n_normal)
        normal_reuse = np.zeros(n_normal)
        normal_legit = np.ones(n_normal)
        normal_issuance = np.zeros(n_normal)

        X_normal = np.column_stack([
            normal_amount, normal_hour, normal_tx_count, normal_amount_ratio, normal_reuse, normal_legit, normal_issuance
        ])

        n_fraud = 200
        fraud_amount = np.random.uniform(500, 5000, size=n_fraud)
        fraud_hour = np.random.choice([1, 2, 3, 23, 0], size=n_fraud)
        fraud_tx_count = np.random.randint(1, 3, size=n_fraud)
        fraud_amount_ratio = np.random.uniform(3, 10, size=n_fraud)
        fraud_reuse = np.random.randint(2, 6, size=n_fraud)
        fraud_legit = np.random.choice([0, 1], p=[0.7, 0.3], size=n_fraud)
        fraud_issuance = np.zeros(n_fraud)

        X_fraud = np.column_stack([
            fraud_amount, fraud_hour, fraud_tx_count, fraud_amount_ratio, fraud_reuse, fraud_legit, fraud_issuance
        ])

        X = np.vstack([X_normal, X_fraud])
        model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        model.fit(X)
        joblib.dump(model, 'model.pkl')
        print("[OK] model.pkl created successfully.")
    else:
        print("[OK] model.pkl already exists.")

def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()
        # Create users
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

        # Create sample credits
        trader1 = User.query.filter_by(username='trader1').first()
        if trader1:
            for origin, should_sign in [
                ('Verra:VCS-1548-2023', True),
                ('Gold Standard:GS-1029-2024', True),
                ('Climate Action Reserve:CAR-9081-2023', False),
            ]:
                if not Credit.query.filter_by(origin=origin).first():
                    credit = Credit(owner_id=trader1.id, origin=origin, signed=False)
                    db.session.add(credit)
                    db.session.flush()
                    if should_sign:
                        approved, _ = verifier_engine.sign_credit(credit)
                        if approved:
                            credit.signed = True
            db.session.commit()
        print("[OK] Database seeded with demo users and credits.")

if __name__ == '__main__':
    init_model()
    init_db()
    print("CarbonCap is ready to run!")
