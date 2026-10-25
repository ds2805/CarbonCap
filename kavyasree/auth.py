"""
Login/session logic + Role-Based Access Control (RBAC).

Usage in a route file:

    from auth import require_role, current_user

    @trader_bp.route("/dashboard")
    @require_role("Trader")
    def dashboard():
        user = current_user()
        ...
"""

from functools import wraps
from flask import Blueprint, request, session, redirect, url_for, render_template, flash, abort, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, ROLES, log_event

auth_bp = Blueprint("auth", __name__)


# ---------- Helpers ----------

def current_user():
    """Returns the logged-in User object, or None."""
    user_id = session.get("user_id")
    if user_id is None:
        auth_header = request.headers.get("X-User-Id")
        if auth_header and auth_header.isdigit():
            user_id = int(auth_header)
    if user_id is None:
        return None
    return User.query.get(user_id)


def login_user(user: User):
    session["user_id"] = user.id
    session["role"] = user.role


def logout_user():
    session.pop("user_id", None)
    session.pop("role", None)


def require_role(*allowed_roles):
    """
    Decorator to protect a route so only the given role(s) can access it.

    @require_role("Trader")
    @require_role("Admin", "Verifier")
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            user = current_user()
            is_api = (
                request.is_json
                or request.path.startswith("/api")
                or "/api/" in request.path
                or request.headers.get("Accept") == "application/json"
                or bool(request.headers.get("X-User-Id"))
            )
            if user is None:
                if is_api:
                    return jsonify({"error": "Please log in first."}), 401
                flash("Please log in first.")
                return redirect(url_for("auth.login"))
            if user.role not in allowed_roles:
                if is_api:
                    return jsonify({"error": f"Access denied. Required role: {', '.join(allowed_roles)}"}), 403
                abort(403)
            return view_func(*args, **kwargs)
        return wrapped
    return decorator


# ---------- Routes ----------

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Support both form data and JSON for mobile app
        payload = request.get_json(silent=True) or {}
        username = request.form.get("username", "").strip() or payload.get("username", "").strip()
        password = request.form.get("password", "") or payload.get("password", "")
        role = request.form.get("role", "") or payload.get("role", "")

        if not username or not password or role not in ROLES:
            if payload:
                return jsonify({"error": "All fields are required and role must be valid"}), 400
            flash("All fields are required and role must be valid.")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(username=username).first():
            if payload:
                return jsonify({"error": "Username already taken"}), 400
            flash("Username already taken.")
            return redirect(url_for("auth.register"))

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            role=role,
        )
        db.session.add(user)
        db.session.commit()
        log_event("register", user.id, f"New {role} account created")

        if payload:
            return jsonify({"success": True, "id": user.id, "username": user.username, "role": user.role})

        flash("Account created. Please log in.")
        return redirect(url_for("auth.login"))

    return render_template("register.html", roles=ROLES)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Support both form data and JSON for mobile app
        payload = request.get_json(silent=True) or {}
        username = request.form.get("username", "").strip() or payload.get("username", "").strip()
        password = request.form.get("password", "") or payload.get("password", "")

        user = User.query.filter_by(username=username).first()
        if user is None or not check_password_hash(user.password_hash, password):
            if payload:  # JSON request from mobile app
                return jsonify({"error": "Invalid username or password"}), 401
            flash("Invalid username or password.")
            log_event("login_failed", None, f"Failed login attempt for '{username}'")
            return redirect(url_for("auth.login"))

        login_user(user)
        log_event("login", user.id, "Successful login")

        # Return JSON for mobile app, redirect for web
        if payload:
            return jsonify({
                "id": user.id,
                "username": user.username,
                "role": user.role,
            })

        # Send each role to its own dashboard
        if user.role == "Trader":
            return redirect(url_for("trader.dashboard"))
        elif user.role == "Verifier":
            return redirect(url_for("verifier.dashboard"))
        elif user.role == "Admin":
            return redirect(url_for("admin.dashboard"))

    return render_template("login.html")


@auth_bp.route("/logout")
def logout():
    user = current_user()
    if user:
        log_event("logout", user.id, "User logged out")
    logout_user()
    return redirect(url_for("auth.login"))


@auth_bp.route("/api/me")
def api_me():
    """JSON API for mobile app - get current user info"""
    user = current_user()
    if user is None:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify({
        "id": user.id,
        "username": user.username,
        "role": user.role,
    })


@auth_bp.route("/api/users")
def api_users():
    """JSON API for mobile app - get all users (for buyer lookup)"""
    user = current_user()
    if user is None:
        return jsonify({"error": "Not logged in"}), 401
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])
