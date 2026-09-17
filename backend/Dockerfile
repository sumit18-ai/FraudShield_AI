FROM python:3.11-slim

# Install system dependencies (libomp-dev is required for xgboost and lightgbm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libomp-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

ENV PORT=8008
ENV PYTHONUNBUFFERED=1

EXPOSE 8008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8008/health || exit 1

# Start uvicorn binding to 0.0.0.0 so the container port is accessible externally
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8008}"]
