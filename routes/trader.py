"""
Trader routes.

Owns: buy / sell / transfer credits -> submitting new transactions.

Core pipeline for /transactions/new (this is the sequencing described in
the architecture doc, section 5):

    1. Load the Credit and sender/receiver Users
    2. Run fraud_engine.check_transaction()  (Mariya)
    3. If clean, run ml_engine.anomaly_score() (Swathy)
    4. If either flags fraud -> block, log, return error
    5. If clean -> hash_chain -> save to DB -> success response
"""

from flask import Blueprint, request, render_template, jsonify

from auth import require_role, current_user
from models import db, Credit, User, Transaction, log_event
from config import Config
import fraud_engine
import ml_engine
import hash_chain

trader_bp = Blueprint("trader", __name__, url_prefix="/trader")


@trader_bp.route("/dashboard")
@require_role("Trader")
def dashboard():
    user = current_user()
    my_credits = Credit.query.filter_by(owner_id=user.id).all()
    my_transactions = (
        Transaction.query.filter(
            (Transaction.sender_id == user.id) | (Transaction.receiver_id == user.id)
        )
        .order_by(Transaction.timestamp.desc())
        .all()
    )
    return render_template(
        "trader_dashboard.html", credits=my_credits, transactions=my_transactions
    )


@trader_bp.route("/transactions/new", methods=["POST"])
@require_role("Trader")
def new_transaction():
    """
    Expects form/JSON fields: credit_id, receiver_id
    Sender is always the logged-in user.
    """
    sender = current_user()
    payload = request.get_json(silent=True) or {}
    credit_id = request.form.get("credit_id", type=int) or payload.get("credit_id")
    receiver_id = request.form.get("receiver_id", type=int) or payload.get("receiver_id")

    credit = Credit.query.get(credit_id)
    receiver = User.query.get(receiver_id)

    if credit is None or receiver is None:
        return jsonify({"status": "error", "reason": "Invalid credit or receiver"}), 400

    if not credit.signed:
        return jsonify({"status": "error", "reason": "Credit is not signed/verified yet"}), 403

    # Build the (uncommitted) transaction so the fraud/ML engines can inspect it
    transaction = Transaction(
        credit_id=credit.id,
        sender_id=sender.id,
        receiver_id=receiver.id,
        status="pending",
    )

    # --- Step 5: Rule-based fraud checks (Mariya) ---
    is_fraud, reason = fraud_engine.check_transaction(transaction, credit, sender)

    if not is_fraud:
        # --- ML anomaly check (Swathy) ---
        score = ml_engine.anomaly_score(transaction, credit, sender, receiver)
        transaction.anomaly_score = score
        if score >= Config.ML_ANOMALY_THRESHOLD:
            is_fraud = True
            reason = f"ML anomaly score {score:.3f} exceeded threshold"

    if is_fraud:
        transaction.status = "flagged"
        db.session.add(transaction)
        db.session.commit()
        log_event(
            "tx_blocked",
            sender.id,
            f"Transaction {transaction.id} blocked: {reason}",
        )
        return jsonify({"status": "blocked", "reason": reason}), 403

    # --- Step 6b: Valid transaction -> hash chain -> save ---
    db.session.add(transaction)
    db.session.flush()  # assigns transaction.id without committing yet

    prev_hash = hash_chain.get_last_hash()
    transaction.prev_hash = prev_hash
    transaction.hash = hash_chain.compute_hash(transaction, prev_hash)
    transaction.status = "valid"

    # Ownership transfer
    credit.owner_id = receiver.id

    db.session.commit()
    log_event("tx_success", sender.id, f"Transaction {transaction.id} completed successfully")

    return jsonify({"status": "valid", "transaction_id": transaction.id, "hash": transaction.hash})
