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
from flask import Blueprint, request, session, redirect, url_for, render_template, flash, abort
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, ROLES, log_event

auth_bp = Blueprint("auth", __name__)


# ---------- Helpers ----------

def current_user():
    """Returns the logged-in User object, or None."""
    user_id = session.get("user_id")
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
            if "user_id" not in session:
                flash("Please log in first.")
                return redirect(url_for("auth.login"))
            if session.get("role") not in allowed_roles:
                # Wrong role hitting the route -> 403
                abort(403)
            return view_func(*args, **kwargs)
        return wrapped
    return decorator


# ---------- Routes ----------

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        role = request.form.get("role", "")

        if not username or not password or role not in ROLES:
            flash("All fields are required and role must be valid.")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(username=username).first():
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

        flash("Account created. Please log in.")
        return redirect(url_for("auth.login"))

    return render_template("register.html", roles=ROLES)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        user = User.query.filter_by(username=username).first()
        if user is None or not check_password_hash(user.password_hash, password):
            flash("Invalid username or password.")
            log_event("login_failed", None, f"Failed login attempt for '{username}'")
            return redirect(url_for("auth.login"))

        login_user(user)
        log_event("login", user.id, "Successful login")

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
