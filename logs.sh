#!/bin/bash

# Script pour voir les logs en temps réel

echo "📋 Logs FHIR Clustering"
echo ""
echo "Quelle service voulez-vous surveiller?"
echo "1) Backend"
echo "2) Redis"
echo "3) Ollama"
echo "4) Tous"
echo ""
read -p "Choix (1-4): " choice

case $choice in
  1)
    docker-compose logs -f backend
    ;;
  2)
    docker-compose logs -f redis
    ;;
  3)
    docker-compose logs -f ollama
    ;;
  4)
    docker-compose logs -f
    ;;
  *)
    echo "Choix invalide"
    exit 1
    ;;
esac
