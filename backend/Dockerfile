FROM python:3.9-slim

# Install system dependencies (libomp-dev is required for xgboost)
RUN apt-get update && apt-get install -y \
    libomp-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8008

# Start uvicorn binding to 0.0.0.0 so the container port is accessible externally
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
