from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WaterQualityData(BaseModel):
    ph: float
    temperature: float
    do: float
    turbidity: float
    salinity: float
    timestamp: Optional[datetime] = None
    location_id: Optional[str] = "realtime"

class PredictionResponse(BaseModel):
    current_ph: float
    forecasted_ph: float
    forecasted_status: str
    anomaly_probability: float
    is_anomaly: bool
    anomaly_score: float
    anomaly_threshold: float
    dwsi: float
    timestamp: str

class BatchPredictionResponse(BaseModel):
    predictions: list
    total_anomalies: int
    avg_dwsi: float