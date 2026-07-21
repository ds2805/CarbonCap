"""
Verifier Engine — OWNED BY MARIYA.

This is a stub so the rest of the app has something to call while the real
logic is being built. Replace the body of sign_credit() with the real
origin-check + signing logic. Keep the function signature the same so
routes/verifier.py doesn't need to change.

Agreed contract:
    sign_credit(credit) -> (approved: bool, reason: str)

    - credit: a models.Credit instance (not yet signed)
    - approved: True if the credit's origin is legitimate and it should be signed
    - reason: short human-readable explanation (used in the audit log)

On approved=True, the caller (routes/verifier.py) is responsible for setting
credit.signed = True and credit.signature = <something>, then committing.
"""

import hashlib
from datetime import datetime, timezone


def sign_credit(credit) -> tuple[bool, str]:
    """
    STUB IMPLEMENTATION.
    TODO (Mariya): replace with real origin verification logic.
    For now: approves anything with a non-empty origin string, and
    generates a placeholder signature so the rest of the pipeline works.
    """
    if not credit.origin or not credit.origin.strip():
        return False, "No origin/source information provided"

    # Placeholder signature generation — replace with real crypto signing logic.
    raw = f"{credit.id}-{credit.origin}-{datetime.now(timezone.utc).isoformat()}"
    placeholder_signature = hashlib.sha256(raw.encode()).hexdigest()
    credit.signature = placeholder_signature

    return True, "Origin verified (stub logic)"
