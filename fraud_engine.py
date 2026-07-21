"""
Rule-Based Fraud Detection Engine — OWNED BY MARIYA.

Stub so the pipeline is wireable before the real rules are built.
Replace the body of check_transaction() with the real double-spend,
ownership, and replay-attack checks. Keep the function signature the same.

Agreed contract:
    check_transaction(transaction, credit, sender) -> (is_fraud: bool, reason: str)

    - transaction: a models.Transaction instance (not yet committed)
    - credit: the models.Credit being transacted
    - sender: the models.User sending/selling
    - is_fraud: True if ANY rule check fails
    - reason: which check failed and why (used in the audit log)
"""


def check_transaction(transaction, credit, sender) -> tuple[bool, str]:
    """
    STUB IMPLEMENTATION.
    TODO (Mariya): replace each check below with real logic:
      1. Double-spending check
      2. Ownership check
      3. Replay attack check
    """
    # --- Ownership check (the one rule the stub can meaningfully do now) ---
    if credit.owner_id != sender.id:
        return True, "Ownership check failed: sender does not own this credit"

    # --- Double-spending check (placeholder — always passes for now) ---
    # TODO: query for a prior *completed/valid* transaction on this credit_id
    # and reject if one exists.

    # --- Replay attack check (placeholder — always passes for now) ---
    # TODO: check for an existing transaction with the same sender, receiver,
    # credit_id, and signature/timestamp fingerprint.

    return False, "No fraud detected (stub logic — rules not fully implemented yet)"
