"""
ML Anomaly Detection Engine (Isolation Forest) — OWNED BY SWATHY.

Stub so the pipeline is wireable before the real model is trained/loaded.
Replace the body of anomaly_score() with the real Isolation Forest inference.
Keep the function signature the same.

Agreed contract:
    anomaly_score(transaction, credit, sender, receiver) -> float

    - Returns a score, higher = more anomalous.
    - The caller compares this against config.Config.ML_ANOMALY_THRESHOLD
      to decide whether to flag the transaction.
"""


def anomaly_score(transaction, credit, sender, receiver) -> float:
    """
    STUB IMPLEMENTATION.
    TODO (Swathy): load the trained scikit-learn IsolationForest model and
    return model.decision_function(...) (or similar) based on real features
    like transaction frequency, size, timing, etc.
    For now: always returns a low, "not anomalous" score so the pipeline
    behaves like the ML layer isn't blocking anything yet.
    """
    return 0.0
