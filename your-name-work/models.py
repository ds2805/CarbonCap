"""
Core database models.

Kept lean on purpose — Mariya will likely want extra fields on Credit
(e.g. signature metadata) and Swathy will add anomaly_score to Transaction
once the ML module is ready. Talk before changing field names/types so
nobody's branch breaks.
"""

from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

ROLES = ("Trader", "Verifier", "Admin")


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Trader / Verifier / Admin
    created_at = db.Column(db.DateTime, default=utcnow)

    credits_owned = db.relationship("Credit", backref="owner", lazy=True)

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class Credit(db.Model):
    __tablename__ = "credit"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # Origin/source details — kept generic for now; Mariya's verifier module
    # will likely need to add structured fields here (registry name,
    # project id, vintage year, etc.)
    origin = db.Column(db.String(255), nullable=False)

    signed = db.Column(db.Boolean, default=False, nullable=False)
    signature = db.Column(db.String(255), nullable=True)  # set once Verifier signs it
    created_at = db.Column(db.DateTime, default=utcnow)

    def __repr__(self):
        return f"<Credit {self.id} signed={self.signed}>"


class Transaction(db.Model):
    __tablename__ = "transaction"

    id = db.Column(db.Integer, primary_key=True)
    credit_id = db.Column(db.Integer, db.ForeignKey("credit.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    timestamp = db.Column(db.DateTime, default=utcnow)

    # Hash chaining fields
    hash = db.Column(db.String(64), nullable=True)
    prev_hash = db.Column(db.String(64), nullable=True)

    # Placeholder for Swathy's ML module — nullable until that's wired in
    anomaly_score = db.Column(db.Float, nullable=True)

    status = db.Column(db.String(20), default="pending", nullable=False)  # valid / flagged / pending

    credit = db.relationship("Credit")
    sender = db.relationship("User", foreign_keys=[sender_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])

    def __repr__(self):
        return f"<Transaction {self.id} status={self.status}>"


class AuditLog(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # login, credit_signed, tx_blocked, tx_success, ...
    actor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=utcnow)

    def __repr__(self):
        return f"<AuditLog {self.event_type} @ {self.timestamp}>"


def log_event(event_type: str, actor_id: int | None, details: str = ""):
    """Append-only audit logging helper. Call this from anywhere in the app."""
    entry = AuditLog(event_type=event_type, actor_id=actor_id, details=details)
    db.session.add(entry)
    db.session.commit()
    return entry
