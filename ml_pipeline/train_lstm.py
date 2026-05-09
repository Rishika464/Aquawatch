import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import joblib
import os

# Create directories
os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)
os.makedirs("images", exist_ok=True)

# 1. Load Dataset
df = pd.read_csv("data/final_scaled_data.csv")
features = ['ph', 'temperature', 'do', 'turbidity', 'salinity', 'ph_change', 'do_change', 'turbidity_change']

def create_sequences(df, seq_len=20):
    X, y_val, ph_curr = [], [], []
    for loc in df['location_id'].unique():
        temp_df = df[df['location_id'] == loc]
        if len(temp_df) < seq_len + 1: 
            continue 
        
        data = temp_df[features].values
        ph_original = temp_df["ph_original"].values 
        
        for i in range(len(data) - seq_len - 1):
            X.append(data[i : i + seq_len])
            y_val.append(ph_original[i + seq_len + 1]) 
            ph_curr.append(ph_original[i + seq_len])
            
    return np.array(X), np.array(y_val), np.array(ph_curr)

print("Creating sequences...")
X, y_raw, ph_current_vals = create_sequences(df)

# 2. Define Anomalies (Percentile Logic)
lower_limit = np.percentile(y_raw, 5)
upper_limit = np.percentile(y_raw, 95)
y_labels = ((y_raw < lower_limit) | (y_raw > upper_limit)).astype(int)

# 3. Train-Test Split
X_train, X_test, y_train, y_test, ph_train_orig, ph_test_orig = train_test_split(
    X, y_labels, ph_current_vals, test_size=0.2, random_state=42, stratify=y_labels
)

# 4. Balancing with SMOTE
n_samples_train, n_timesteps, n_features = X_train.shape
X_train_flat = X_train.reshape(n_samples_train, n_timesteps * n_features)

k_neighbors = min(5, np.sum(y_train) - 1)
sm = SMOTE(k_neighbors=k_neighbors, random_state=42)
X_train_resampled_flat, y_train_resampled = sm.fit_resample(X_train_flat, y_train)

X_train_resampled = X_train_resampled_flat.reshape(-1, n_timesteps, n_features)
print(f"Training distribution after SMOTE: {np.bincount(y_train_resampled)}")

# 5. Build LSTM Model
model = Sequential([
    Input(shape=(n_timesteps, n_features)),
    LSTM(64, return_sequences=True),
    Dropout(0.2),
    LSTM(32),
    Dense(16, activation='relu'),
    Dense(1, activation='sigmoid') 
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# 6. Training
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
print("\nTraining Model...")
model.fit(
    X_train_resampled, y_train_resampled, 
    epochs=20, 
    batch_size=64, 
    validation_data=(X_test, y_test), 
    callbacks=[early_stop],
    verbose=1
)

# 7. Generate Predictions
y_pred_prob = model.predict(X_test)
threshold = 0.6 
y_pred = (y_pred_prob > threshold).astype(int).flatten()

# Create results table
results_df = pd.DataFrame({
    'Current_pH_Value': ph_test_orig,
    'Actual_Tomorrow_Status': y_test,
    'Forecasted_Tomorrow_Status': y_pred,
    'Anomaly_Probability': np.round(y_pred_prob.flatten(), 4)
})

status_map = {0: "Safe ✅", 1: "Anomaly 🚨"}
results_df['Actual_Tomorrow_Status'] = results_df['Actual_Tomorrow_Status'].map(status_map)
results_df['Forecasted_Tomorrow_Status'] = results_df['Forecasted_Tomorrow_Status'].map(status_map)

# 8. Final Outputs
print("\n✅ Classification Report:")
print(classification_report(y_test, y_pred))

auc = roc_auc_score(y_test, y_pred_prob)
print(f"📈 ROC-AUC Score: {auc:.4f}")

# Save to models folder
model.save("models/water_forecast_model.keras")
results_df.to_csv("data/forecast_results_table.csv", index=False)

print("\n--- PREVIEW OF FORECAST TABLE ---")
print(results_df.head(15).to_string(index=False))

print("\n💾 Files saved: 'models/water_forecast_model.keras' and 'data/forecast_results_table.csv'")