"""
SHA-256 hash chaining for tamper-evident transactions.

Each transaction's hash is derived from its own data PLUS the hash of the
previous transaction in the ledger, so altering any past record breaks
every hash that comes after it.
"""

import hashlib

from models import Transaction


def get_last_hash() -> str:
    """Returns the hash of the most recent transaction, or a genesis value if none exist."""
    last_tx = Transaction.query.order_by(Transaction.id.desc()).first()
    if last_tx is None or not last_tx.hash:
        return "0" * 64  # genesis hash
    return last_tx.hash


def compute_hash(transaction: Transaction, prev_hash: str) -> str:
    """
    Computes the SHA-256 hash for a transaction given the previous hash.
    Must be called AFTER transaction.id, credit_id, sender_id, receiver_id,
    and timestamp are set (id requires a flush if not yet committed).
    """
    raw = (
        f"{transaction.id}|{transaction.credit_id}|"
        f"{transaction.sender_id}|{transaction.receiver_id}|"
        f"{transaction.timestamp}|{prev_hash}"
    )
    return hashlib.sha256(raw.encode()).hexdigest()
