#!/bin/bash

# Script pour arrêter tous les services (prod et dev)

echo "🛑 Arrêt des services FHIR Clustering..."
echo ""

# Vérifier quel mode est actif
if docker ps | grep -q "fhir-.*-dev"; then
    echo "Mode développement détecté"
    docker-compose -f docker-compose.dev.yml down
fi

if docker ps | grep -q "fhir-backend" && ! docker ps | grep -q "fhir-backend-dev"; then
    echo "Mode production détecté"
    docker-compose down
fi

# Arrêter les deux au cas où
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

echo ""
echo "✅ Tous les services sont arrêtés"
echo ""
echo "📊 Pour voir l'espace Docker utilisé:"
echo "  docker system df"
echo ""
echo "🧹 Pour nettoyer Docker:"
echo "  ./cleanup-docker.sh --soft"
echo ""
echo "Pour redémarrer:"
echo "  Production : ./start.sh"
echo "  Développement : ./start-dev.sh"
