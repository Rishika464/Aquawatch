cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Copy requirements from root
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app.py from backend folder
COPY backend/app.py .

# Debug: show what files we have
RUN ls -la /app/

# Set environment
ENV PORT=8080

# Run the app
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
EOF
