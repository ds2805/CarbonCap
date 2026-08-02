"""
Rule-Based Fraud Detection Engine — OWNED BY MARIYA.

Real double-spend, ownership, and replay-attack checks.

Agreed contract (unchanged):
    check_transaction(transaction, credit, sender) -> (is_fraud: bool, reason: str)
"""

from models import Transaction, db


def check_transaction(transaction, credit, sender) -> tuple[bool, str]:
    """
    Runs three fraud checks, in order. Returns on the first one that fails.

    1. Ownership check — does sender actually own this credit?
    2. Double-spending check — has this credit already been sold/transferred
       in a completed (status="valid") transaction before?
    3. Replay attack check — has this exact transaction (same sender,
       receiver, credit) already been processed?
    """

    # --- 1. Ownership check (already implemented) ---
    if credit.owner_id != sender.id:
        return True, "Ownership check failed: sender does not own this credit"

    # --- 2. Double-spending check ---
    # Look up past transactions on this same credit that already completed
    # successfully. If one exists, this credit has already been spent —
    # trying to transact it again is double-spending, no matter who the
    # sender/receiver are this time.
    prior_valid_tx_query = db.session.query(Transaction).filter(
        Transaction.credit_id == credit.id,
        Transaction.status == "valid",
    )
    # Exclude the current transaction itself in case it's already been
    # added to the session (e.g. given a temporary id) before this check runs.
    if getattr(transaction, "id", None) is not None:
        prior_valid_tx_query = prior_valid_tx_query.filter(Transaction.id != transaction.id)

    prior_valid_tx = prior_valid_tx_query.first()
    if prior_valid_tx is not None:
        return True, (
            f"Double-spending detected: credit #{credit.id} was already "
            f"spent in transaction #{prior_valid_tx.id}"
        )

    # --- 3. Replay attack check ---
    # Look for an exact duplicate: same sender, same receiver, same credit,
    # already processed successfully. This catches an attacker resubmitting
    # (replaying) a previously valid transaction to trigger it again.
    duplicate_query = db.session.query(Transaction).filter(
        Transaction.credit_id == credit.id,
        Transaction.sender_id == sender.id,
        Transaction.receiver_id == transaction.receiver_id,
        Transaction.status == "valid",
    )
    if getattr(transaction, "id", None) is not None:
        duplicate_query = duplicate_query.filter(Transaction.id != transaction.id)

    duplicate_tx = duplicate_query.first()
    if duplicate_tx is not None:
        return True, (
            f"Replay attack detected: an identical transaction "
            f"(#{duplicate_tx.id}) for this sender/receiver/credit was already processed"
        )

    # --- All checks passed ---
    return False, "No fraud detected: ownership, double-spend, and replay checks passed"