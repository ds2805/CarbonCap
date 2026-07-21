"""
CarbonCap — Flask app entry point.

Run with:
    python app.py

This wires together: DB init, auth/session, RBAC-protected blueprints for
each role, and (once Mariya/Swathy's modules land) the fraud detection
pipeline in routes/trader.py.
"""

from flask import Flask, redirect, url_for

from config import Config
from models import db

from auth import auth_bp
from routes.trader import trader_bp
from routes.verifier import verifier_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(trader_bp)
    app.register_blueprint(verifier_bp)
    app.register_blueprint(admin_bp)

    @app.route("/")
    def index():
        return redirect(url_for("auth.login"))

    with app.app_context():
        db.create_all()  # dev convenience; use migrations for real schema changes later

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
