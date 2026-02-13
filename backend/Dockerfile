FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app/ /app/app/

# Copy pipeline modules
COPY fhir_clustering/ /app/fhir_clustering/
COPY workflows/ /app/workflows/

# Copy data & terminology (baked in — no volume mounts needed)
COPY data/ /app/data/
COPY terminology_omop/ /app/terminology_omop/

# Results dir (will be mounted as volume for output)
RUN mkdir -p /app/results

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
