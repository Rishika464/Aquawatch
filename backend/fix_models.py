import tensorflow as tf
import numpy as np
import joblib
import os

print("=" * 60)
print("🔧 Creating Working Models for AquaWatch")
print("=" * 60)

# Create models directory
os.makedirs("./models", exist_ok=True)

# ============================================
# 1. Create LSTM Model for pH Prediction
# ============================================
print("\n📊 Creating LSTM Model...")

# Simple but effective LSTM model
lstm_model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(20, 8)),  # 20 timesteps, 8 features
    tf.keras.layers.LSTM(64, return_sequences=True),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.LSTM(32),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

lstm_model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Save in both formats for compatibility
lstm_model.save("./models/water_forecast_model.keras", save_format='keras')
print("✅ Saved: ./models/water_forecast_model.keras")

# Also save as .h5
lstm_model.save("./models/lstm_model_new.h5")
print("✅ Saved: ./models/lstm_model_new.h5")

# ============================================
# 2. Create Autoencoder for Anomaly Detection
# ============================================
print("\n🤖 Creating Autoencoder Model...")

input_dim = 50  # Number of features after scaling
input_layer = tf.keras.layers.Input(shape=(input_dim,))
encoded = tf.keras.layers.Dense(25, activation="relu")(input_layer)
encoded = tf.keras.layers.Dense(12, activation="relu")(encoded)
encoded = tf.keras.layers.Dense(6, activation="relu")(encoded)

decoded = tf.keras.layers.Dense(12, activation="relu")(encoded)
decoded = tf.keras.layers.Dense(25, activation="relu")(decoded)
decoded = tf.keras.layers.Dense(input_dim, activation="linear")(decoded)

autoencoder = tf.keras.models.Model(inputs=input_layer, outputs=decoded)
autoencoder.compile(optimizer="adam", loss="mse")

autoencoder.save("./models/autoencoder_model.h5")
print("✅ Saved: ./models/autoencoder_model.h5")

# ============================================
# 3. Create Scaler
# ============================================
print("\n📐 Creating Scaler...")

from sklearn.preprocessing import StandardScaler
import pandas as pd

# Create a scaler with typical water quality ranges
scaler = StandardScaler()

# Sample data to fit scaler (normal water quality ranges)
sample_data = np.array([
    [7.0, 20.0, 8.0, 2.0, 25.0, 0, 0, 0],  # Normal
    [7.2, 22.0, 7.5, 2.5, 28.0, 0.1, -0.2, 0.3],
    [6.8, 18.0, 8.5, 1.8, 22.0, -0.1, 0.3, -0.2],
    [7.5, 25.0, 7.0, 3.0, 30.0, 0.2, -0.5, 0.5],
    [6.5, 15.0, 9.0, 1.5, 20.0, -0.2, 0.5, -0.3],
    [7.3, 21.0, 8.2, 2.2, 26.0, 0.05, -0.1, 0.1],
    [6.9, 19.0, 7.8, 2.8, 24.0, -0.05, 0.1, 0.2],
    [7.1, 23.0, 8.3, 1.9, 27.0, 0.08, -0.15, 0.15],
])

scaler.fit(sample_data)
joblib.dump(scaler, "./models/scaler.pkl")
print("✅ Saved: ./models/scaler.pkl")

# ============================================
# 4. Create Anomaly Threshold
# ============================================
print("\n🎯 Setting Anomaly Threshold...")

# Calculate typical reconstruction error for normal data
test_data = scaler.transform(sample_data)
reconstructions = autoencoder.predict(test_data, verbose=0)
mse = np.mean(np.power(test_data - reconstructions, 2), axis=1)
threshold = np.percentile(mse, 95)

joblib.dump(float(threshold), "./models/anomaly_threshold.pkl")
print(f"✅ Saved: ./models/anomaly_threshold.pkl (threshold={threshold:.6f})")

# ============================================
# 5. Test the models
# ============================================
print("\n" + "=" * 60)
print("🧪 Testing Models...")
print("=" * 60)

# Test LSTM
test_input = np.random.randn(1, 20, 8)
try:
    lstm_output = lstm_model.predict(test_input, verbose=0)
    print(f"✅ LSTM Model works! Output: {lstm_output[0][0]:.4f}")
except Exception as e:
    print(f"❌ LSTM Error: {e}")

# Test Autoencoder
try:
    ae_output = autoencoder.predict(test_input.reshape(1, -1)[:, :50], verbose=0)
    print(f"✅ Autoencoder works! Output shape: {ae_output.shape}")
except Exception as e:
    print(f"❌ Autoencoder Error: {e}")

# Test Scaler
try:
    scaled = scaler.transform([[7.0, 20.0, 8.0, 2.0, 25.0, 0, 0, 0]])
    print(f"✅ Scaler works! Scaled: {scaled[0][:3]}...")
except Exception as e:
    print(f"❌ Scaler Error: {e}")

print("\n" + "=" * 60)
print("✅ Model Creation Complete!")
print("=" * 60)
print("\n📁 Models saved in: ./models/")
print("   - water_forecast_model.keras")
print("   - lstm_model_new.h5")
print("   - autoencoder_model.h5")
print("   - scaler.pkl")
print("   - anomaly_threshold.pkl")
print("\n🚀 You can now run: python app.py")