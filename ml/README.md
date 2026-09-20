# RAILBLOCK AI — ML Layer

This directory contains machine learning models and training scripts.

## Planned Components (future stages)

### Priority Scoring Model
- Input: asset criticality, defect severity, overdue days, operational impact
- Output: priority score 0–100
- Algorithm: Gradient Boosted Trees (XGBoost / LightGBM)
- Training data: historical maintenance records

### Anomaly Detection
- Input: maintenance history, defect frequency, asset age
- Output: anomaly probability
- Algorithm: Isolation Forest / LSTM

### Demand Forecasting
- Input: seasonal patterns, historical block utilization
- Output: predicted block demand per section per week

## Status
PLANNED — Not implemented in Stage 1.
