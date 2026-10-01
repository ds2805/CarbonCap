"""
ML Anomaly Detection Engine (Isolation Forest) — OWNED BY SWATHY.

Isolation Forest model for detecting anomalous carbon credit transactions.
The model is trained on synthetic data and loaded at runtime.

Agreed contract:
    anomaly_score(transaction, credit, sender, receiver) -> float

    - Returns a score, higher = more anomalous.
    - The caller compares this against config.Config.ML_ANOMALY_THRESHOLD
      to decide whether to flag the transaction.
"""

import joblib
import numpy as np
from datetime import datetime, timezone
import os

# Load model and scaler at module import
MODEL_PATH = 'model.pkl'
SCALER_PATH = None  # Not used with the pre-trained model

_model = None
_scaler = None

def _load_model():
    """Load the trained model."""
    global _model, _scaler
    
    try:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            return True
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def extract_features(transaction, credit, sender, receiver):
    """
    Extract features from transaction data for ML model.
    
    Features match the training data from train_isolation_forest.py:
    - amount: Transaction amount
    - hour_of_day: Transaction timing (0-23)
    - sender_tx_count: Number of transactions by this sender
    - amount_vs_sender_avg: How far this amount is from sender's usual amount
    - credit_reuse_count: How many times this credit_id appears in transactions
    - source_project_legit: Whether the source project is legitimate (0/1)
    - is_registry_issuance: Whether this is a registry issuance (0/1)
    """
    from models import Transaction, User
    
    # Time-based features
    timestamp = transaction.timestamp if hasattr(transaction, 'timestamp') else datetime.now(timezone.utc)
    hour_of_day = timestamp.hour
    
    # Amount - use a default if not available
    amount = getattr(transaction, 'amount', 50.0)  # Default amount
    
    # Transaction count features (would need DB query in real implementation)
    # For now, use placeholder values based on user IDs
    sender_tx_count = getattr(sender, 'id', 0) % 20 + 1  # Simple proxy
    
    # Amount vs sender average (would need historical data)
    # For now, use a simple heuristic
    amount_vs_sender_avg = 0.0  # Default: normal amount
    
    # Credit reuse count (would need DB query to check historical transactions)
    # For now, use simple heuristic based on credit ID
    credit_reuse_count = getattr(credit, 'id', 0) % 5  # Simple proxy
    
    # Source project legitimacy (would need credit metadata)
    # For now, assume most are legitimate
    source_project_legit = 1  # Default: legitimate
    
    # Registry issuance check
    sender_name = getattr(sender, 'username', '')
    is_registry_issuance = 1 if sender_name == 'REGISTRY_ISSUANCE' else 0
    
    features = np.array([[
        amount,
        hour_of_day,
        sender_tx_count,
        amount_vs_sender_avg,
        credit_reuse_count,
        source_project_legit,
        is_registry_issuance
    ]])
    
    return features

def anomaly_score(transaction, credit, sender, receiver) -> float:
    """
    Calculate anomaly score for a transaction using Isolation Forest.
    
    Returns:
        float: Anomaly score (higher = more anomalous). 
               Isolation Forest decision_function returns negative values for anomalies,
               so we negate and normalize to get a positive score.
    """
    global _model, _scaler
    
    # Load model if not already loaded
    if _model is None:
        if not _load_model():
            # Return default score if model loading fails
            return 0.0
    
    try:
        # Extract features
        features = extract_features(transaction, credit, sender, receiver)
        
        # Get anomaly score from Isolation Forest (no scaling needed for pre-trained model)
        # decision_function returns negative values for anomalies
        raw_score = _model.decision_function(features)[0]
        
        # Convert to positive score (higher = more anomalous)
        # Isolation Forest returns values around -0.5 to 0.5, with negative for anomalies
        # We negate and add offset to get 0-1 range
        anomaly_score = -raw_score
        
        # Normalize to approximately 0-1 range
        anomaly_score = (anomaly_score + 0.5) / 1.0
        anomaly_score = max(0.0, min(1.0, anomaly_score))
        
        return anomaly_score
        
    except Exception as e:
        print(f"Error calculating anomaly score: {e}")
        return 0.0



