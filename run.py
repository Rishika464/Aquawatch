#!/usr/bin/env python
"""
AquaWatch Launcher
Run this script to start both backend and frontend
"""

import subprocess
import sys
import os
import webbrowser
import time
import signal
import threading

def run_backend():
    """Start the FastAPI backend"""
    os.chdir("backend")
    subprocess.run([sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

def run_frontend():
    """Start a simple HTTP server for frontend"""
    os.chdir("frontend")
    subprocess.run([sys.executable, "-m", "http.server", "8080"])

if __name__ == "__main__":
    print("=" * 50)
    print("🌊 AquaWatch - Water Quality Monitoring System")
    print("=" * 50)
    print("\nStarting services...")
    
    # Create necessary directories
    os.makedirs("backend/models", exist_ok=True)
    os.makedirs("frontend", exist_ok=True)
    
    # Open browser after a delay
    def open_browser():
        time.sleep(3)
        webbrowser.open("http://localhost:8080")
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    print("\n📡 Backend API: http://localhost:8000")
    print("🎨 Frontend UI: http://localhost:8080")
    print("\n⚠️ Make sure your trained models are in backend/models/")
    print("   Required files:")
    print("   - water_forecast_model.keras")
    print("   - autoencoder_model.h5")
    print("   - scaler.pkl")
    print("   - anomaly_threshold.pkl")
    print("\nPress Ctrl+C to stop all services\n")
    
    try:
        # Start backend in background
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"],
            cwd="backend"
        )
        
        # Start frontend server
        frontend_proc = subprocess.Popen(
            [sys.executable, "-m", "http.server", "8080"],
            cwd="frontend"
        )
        
        # Wait for interrupt
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("✅ Done!")