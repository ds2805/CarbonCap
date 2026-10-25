"""
Verifier Engine — OWNED BY MARIYA.

Real origin-check + signing logic.

Agreed contract (unchanged):
    sign_credit(credit) -> (approved: bool, reason: str)
"""

import hashlib
import hmac
import re
from datetime import datetime, timezone

from models import Credit, db

# Recognized carbon credit registries. In a real system this would come
# from a config file or external registry API; for this simulation we
# keep a fixed allow-list.
ALLOWED_REGISTRIES = {
    "verra",
    "gold standard",
    "american carbon registry",
    "climate action reserve",
    "plan vivo",
}

# Expected format: "<RegistryName>:<ProjectID>"
# e.g. "Verra:VCS-1548-2023"
ORIGIN_PATTERN = re.compile(r"^([A-Za-z ]+):([A-Za-z0-9\-]+)$")

# Secret key used to generate the Verifier's signature.
# TODO: move this into config.py / environment variable before deployment.
VERIFIER_SECRET_KEY = b"carboncap-verifier-secret-key-change-me"


def sign_credit(credit: Credit) -> tuple[bool, str]:
    """
    Real origin verification logic.

    1. Reject empty origin.
    2. Reject origin that doesn't match "Registry:ProjectID" format.
    3. Reject origin from a registry not in the allowed list.
    4. Reject origin already used by another signed credit (prevents
       duplicate/fake credit injection using a copied project ID).
    5. If all checks pass, generate a real HMAC-based signature and
       mark the credit as approved.
    """
    origin = (credit.origin or "").strip()

    # 1. Empty origin
    if not origin:
        return False, "No origin/source information provided"

    # 2. Format check
    match = ORIGIN_PATTERN.match(origin)
    if not match:
        return False, f"Origin '{origin}' does not match expected format 'Registry:ProjectID'"

    registry_name, project_id = match.group(1).strip().lower(), match.group(2).strip()

    # 3. Known registry check
    if registry_name not in ALLOWED_REGISTRIES:
        return False, f"Unrecognized registry '{registry_name}'"

    # 4. Duplicate-origin check — same origin already signed for a different credit
    existing = (
        db.session.query(Credit)
        .filter(Credit.origin == credit.origin, Credit.signed.is_(True), Credit.id != credit.id)
        .first()
    )
    if existing is not None:
        return False, f"Origin '{origin}' already used by signed credit #{existing.id}"

    # 5. Generate a real signature (HMAC-SHA256) tying the signature to
    # this specific credit + origin + timestamp, so it can't be reused
    # or forged without the secret key.
    timestamp = datetime.now(timezone.utc).isoformat()
    message = f"{credit.id}-{credit.origin}-{timestamp}".encode()
    signature = hmac.new(VERIFIER_SECRET_KEY, message, hashlib.sha256).hexdigest()

    credit.signature = signature

    return True, f"Origin verified against registry '{registry_name}'"