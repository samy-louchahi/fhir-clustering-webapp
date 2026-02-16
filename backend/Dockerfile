# Image de base optimisée
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (optimisé pour réduire la taille)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy and install Python dependencies (cache-friendly layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && rm -rf /root/.cache/pip

# Copy application code
COPY backend/app/ /app/app/

# Copy pipeline modules
COPY fhir_clustering/ /app/fhir_clustering/
COPY workflows/ /app/workflows/

# ⚠️ Les données ne sont PLUS copiées dans l'image !
# Elles sont montées via volumes dans docker-compose.yml
# Cela réduit drastiquement la taille de l'image et permet 
# de mettre à jour les données sans rebuild

# Créer les répertoires qui seront montés
RUN mkdir -p /app/results /app/data /app/terminology_omop

# Optimisation: supprimer les fichiers de compilation Python inutiles
RUN find /usr/local/lib/python3.12 -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /usr/local/lib/python3.12 -name '*.pyc' -delete 2>/dev/null || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
