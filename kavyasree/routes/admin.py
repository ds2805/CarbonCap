"""
Admin routes.

Owns: manage user accounts, view system-wide transactions and audit logs.
"""

from flask import Blueprint, render_template, jsonify, request

from auth import require_role, current_user
from models import db, User, Transaction, AuditLog, ROLES, log_event

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/dashboard")
@require_role("Admin")
def dashboard():
    users = User.query.all()
    transactions = Transaction.query.order_by(Transaction.timestamp.desc()).limit(100).all()
    audit_log = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(200).all()
    return render_template(
        "admin_dashboard.html", users=users, transactions=transactions, audit_log=audit_log
    )


@admin_bp.route("/users")
@require_role("Admin")
def list_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])


@admin_bp.route("/users/<int:user_id>/deactivate", methods=["POST"])
@require_role("Admin")
def deactivate_user(user_id):
    """
    Placeholder for account management. Extend the User model with an
    `active` boolean if hard deletion isn't desired.
    """
    admin = current_user()
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    log_event("user_deactivated", admin.id, f"User {user_id} ({user.username}) removed")
    return jsonify({"status": "ok"})


@admin_bp.route("/transactions")
@require_role("Admin")
def list_transactions():
    transactions = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    return jsonify(
        [
            {
                "id": t.id,
                "credit_id": t.credit_id,
                "sender_id": t.sender_id,
                "receiver_id": t.receiver_id,
                "status": t.status,
                "anomaly_score": t.anomaly_score,
                "hash": t.hash,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in transactions
        ]
    )


@admin_bp.route("/audit-log")
@require_role("Admin")
def list_audit_log():
    entries = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify(
        [
            {
                "id": e.id,
                "event_type": e.event_type,
                "actor_id": e.actor_id,
                "details": e.details,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in entries
        ]
    )
