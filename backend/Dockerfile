FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ /app/app/

# Copy additional modules needed at runtime
# Note: fhir_clustering, workflows, etc. are mounted via volumes

# Health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:8000/health || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
