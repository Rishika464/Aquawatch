import pandas as pd
import numpy as np
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import joblib
import os

# Create directories
os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)
os.makedirs("images", exist_ok=True)

# 🔹 Step 1: Load data
df = pd.read_csv("data/final_scaled_data.csv")

print("Before cleaning:")
print(df.dtypes)

# 🔥 Step 2: Drop non-numeric columns
df = df.drop(columns=["timestamp", "location_id"], errors='ignore')

# 🔥 Step 3: Convert to numeric
df = df.apply(pd.to_numeric, errors='coerce')

# 🔥 Step 4: Handle missing values
df = df.fillna(df.mean())

print("\nAfter cleaning:")
print(df.dtypes)
print("Shape:", df.shape)

# 🔹 Step 5: Convert to numpy
X = df.values.astype(np.float32)

# 🔹 Step 6: Train-test split
X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

# 🔹 Step 7: Build Autoencoder
input_dim = X.shape[1]

input_layer = Input(shape=(input_dim,))
encoded = Dense(16, activation="relu")(input_layer)
encoded = Dense(8, activation="relu")(encoded)

decoded = Dense(16, activation="relu")(encoded)
decoded = Dense(input_dim, activation="linear")(decoded)

autoencoder = Model(inputs=input_layer, outputs=decoded)
autoencoder.compile(optimizer="adam", loss="mse")

print("\n✅ Model built")

# 🔹 Step 8: Train model
history = autoencoder.fit(
    X_train, X_train,
    epochs=20,
    batch_size=32,
    validation_data=(X_test, X_test),
    verbose=1
)

print("\n✅ Training completed")

# 🔹 Step 9: Reconstruction
reconstructions = autoencoder.predict(X_test)

# 🔹 Step 10: Compute reconstruction error
mse = np.mean(np.power(X_test - reconstructions, 2), axis=1)

# 🔹 Step 11: Threshold (top 5%)
threshold = np.percentile(mse, 95)

print("\n📌 Threshold:", threshold)

# 🔹 Step 12: Detect anomalies
anomalies = mse > threshold
num_anomalies = np.sum(anomalies)

print("🚨 Total anomalies detected:", num_anomalies)

# 🔹 Step 13: Save anomaly results
results = pd.DataFrame({
    "Reconstruction_Error": mse,
    "Anomaly": anomalies
})

results.to_csv("data/anomaly_results.csv", index=False)
print("💾 data/anomaly_results.csv saved")

# 🔥 Step 14: Save threshold to models folder
joblib.dump(threshold, "models/anomaly_threshold.pkl")
print("💾 models/anomaly_threshold.pkl saved")

# 🔥 Step 15: Save model
autoencoder.save("models/autoencoder_model.h5")
print("💾 models/autoencoder_model.h5 saved")

# 🔹 Step 16: Plot anomaly graph
plt.figure(figsize=(10,5))
plt.plot(mse, label="Reconstruction Error")
plt.scatter(
    np.where(anomalies)[0],
    mse[anomalies],
    color='red',
    label="Anomalies"
)
plt.axhline(threshold, color='r', linestyle='--', label="Threshold")
plt.title("Anomaly Detection")
plt.xlabel("Samples")
plt.ylabel("Error")
plt.legend()
plt.savefig("images/anomaly_plot.png")
plt.show()

# 🔹 Step 17: Training loss graph
plt.figure()
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.legend()
plt.title("Training Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.savefig("images/anomaly_training_loss.png")
plt.show()

print("📊 Images saved to images/ folder")