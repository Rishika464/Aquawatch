import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Create directories
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

# 🔹 Load dataset
df = pd.read_csv("data/final_water_data.csv")

print("Dataset loaded:", df.shape)

# 🔥 STEP 1: KEEP ORIGINAL pH
df["ph_original"] = df["ph"]
df["ph_change"] = df.groupby('location_id')['ph'].diff().fillna(0)
df["do_change"] = df.groupby('location_id')['do'].diff().fillna(0)
df["turbidity_change"] = df.groupby('location_id')['turbidity'].diff().fillna(0)

# 🔹 Features
features = [
    'ph', 'temperature', 'do', 'turbidity', 'salinity',
    'ph_change', 'do_change', 'turbidity_change'
]

# 🔹 Ensure features exist
for col in features:
    if col not in df.columns:
        df[col] = 0

# 🔹 Drop rows with missing values
df = df.dropna(subset=features)

# 🔹 Initialize scaler
scaler = StandardScaler()

# 🔹 Scale only selected features
scaled_values = scaler.fit_transform(df[features])

df_scaled = df.copy()
df_scaled[features] = scaled_values

# 🔹 Save dataset
df_scaled.to_csv("data/final_scaled_data.csv", index=False)

# 🔹 Save scaler to models folder
joblib.dump(scaler, "models/scaler.pkl")

print("✅ Feature engineering completed")
print("Final shape:", df_scaled.shape)