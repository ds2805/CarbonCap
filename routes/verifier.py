"""
Verifier routes.

Owns: view unsigned credits, sign them.

Pipeline for /credits/new (architecture doc, section 4):
    1. A credit is submitted with origin info (unsigned)
    2. verifier_engine.sign_credit() (Mariya) checks legitimacy
    3. If approved -> mark signed, save
    4. If rejected -> stays unsigned/blocked, logged
"""

from flask import Blueprint, request, render_template, jsonify

from auth import require_role, current_user
from models import db, Credit, log_event
import verifier_engine

verifier_bp = Blueprint("verifier", __name__, url_prefix="/verifier")


@verifier_bp.route("/dashboard")
@require_role("Verifier")
def dashboard():
    unsigned_credits = Credit.query.filter_by(signed=False).all()
    signed_credits = Credit.query.filter_by(signed=True).all()
    return render_template(
        "verifier_dashboard.html", unsigned=unsigned_credits, signed=signed_credits
    )


@verifier_bp.route("/credits/new", methods=["POST"])
@require_role("Verifier")
def new_credit():
    """
    A Verifier submits a new credit for signing on behalf of a Trader/owner.
    Expects form/JSON fields: owner_id, origin
    """
    verifier = current_user()
    payload = request.get_json(silent=True) or {}
    owner_id = request.form.get("owner_id", type=int) or payload.get("owner_id")
    origin = request.form.get("origin") or payload.get("origin")

    if not owner_id or not origin:
        return jsonify({"status": "error", "reason": "owner_id and origin are required"}), 400

    credit = Credit(owner_id=owner_id, origin=origin, signed=False)
    db.session.add(credit)
    db.session.flush()  # assign credit.id before signing

    approved, reason = verifier_engine.sign_credit(credit)

    if approved:
        credit.signed = True
        db.session.commit()
        log_event("credit_signed", verifier.id, f"Credit {credit.id} signed: {reason}")
        return jsonify({"status": "signed", "credit_id": credit.id, "reason": reason})
    else:
        db.session.commit()  # credit stays saved but unsigned/blocked
        log_event("credit_blocked", verifier.id, f"Credit {credit.id} blocked: {reason}")
        return jsonify({"status": "blocked", "credit_id": credit.id, "reason": reason}), 403


@verifier_bp.route("/credits/<int:credit_id>/sign", methods=["POST"])
@require_role("Verifier")
def sign_existing_credit(credit_id):
    """Sign an already-submitted, currently-unsigned credit."""
    verifier = current_user()
    credit = Credit.query.get_or_404(credit_id)

    if credit.signed:
        return jsonify({"status": "error", "reason": "Credit already signed"}), 400

    approved, reason = verifier_engine.sign_credit(credit)

    if approved:
        credit.signed = True
        db.session.commit()
        log_event("credit_signed", verifier.id, f"Credit {credit.id} signed: {reason}")
        return jsonify({"status": "signed", "credit_id": credit.id, "reason": reason})
    else:
        db.session.commit()
        log_event("credit_blocked", verifier.id, f"Credit {credit.id} blocked: {reason}")
        return jsonify({"status": "blocked", "credit_id": credit.id, "reason": reason}), 403
