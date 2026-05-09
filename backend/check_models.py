import os
import h5py
import tensorflow as tf

print("=" * 50)
print("Model File Diagnostic")
print("=" * 50)

# Check current directory
print(f"\nCurrent directory: {os.getcwd()}")

# Check models folder
models_path = "./models"
if os.path.exists(models_path):
    print(f"\n✅ Models folder exists: {models_path}")
    files = os.listdir(models_path)
    print(f"Files in models folder: {files}")
    
    for file in files:
        file_path = os.path.join(models_path, file)
        file_size = os.path.getsize(file_path)
        print(f"\n📄 {file}: {file_size} bytes")
        
        # Check if it's a valid H5 file
        if file.endswith(('.h5', '.keras')):
            try:
                with h5py.File(file_path, 'r') as f:
                    print(f"   ✅ Valid H5 file")
                    print(f"   Keys: {list(f.keys())[:5]}")
            except Exception as e:
                print(f"   ❌ Invalid H5 file: {e}")
else:
    print(f"\n❌ Models folder not found: {models_path}")

# Try to load model
print("\n" + "=" * 50)
print("Attempting to load models...")
print("=" * 50)

# Try different paths
possible_paths = [
    "./models/water_forecast_model.keras",
    "./models/lstm_model.h5",
    "../water_forecast_model.keras",
    "../lstm_model.h5",
    "./water_forecast_model.keras",
    "./lstm_model.h5",
]

for path in possible_paths:
    if os.path.exists(path):
        print(f"\n📂 Found: {path}")
        try:
            model = tf.keras.models.load_model(path)
            print(f"   ✅ Successfully loaded model from {path}")
            print(f"   Model summary: {model.summary()}")
            break
        except Exception as e:
            print(f"   ❌ Failed to load: {e}")
    else:
        print(f"\n❌ Not found: {path}")