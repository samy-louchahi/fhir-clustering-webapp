#!/bin/bash

# Script pour arrêter tous les services

echo "🛑 Arrêt des services FHIR Clustering..."

# Arrêter docker-compose
docker-compose down

echo ""
echo "✅ Tous les services sont arrêtés"
echo ""
echo "Pour redémarrer:"
echo "  docker-compose up -d"
echo "  cd frontend && npm run dev"
