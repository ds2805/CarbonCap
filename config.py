"""
Shared configuration for the whole team.
Everyone should import settings from here instead of hardcoding
secret keys, DB paths, etc. in their own files.

Real secrets belong in a local .env file (never committed).
Copy .env.example to .env and fill in your own values.
"""

import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'carboncap.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Threshold above which the ML anomaly score (Swathy's module) marks a
    # transaction as flagged. Kept here so it's tunable in one place.
    ML_ANOMALY_THRESHOLD = float(os.environ.get("ML_ANOMALY_THRESHOLD", "0.6"))
