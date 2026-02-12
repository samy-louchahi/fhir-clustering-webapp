#!/bin/bash

# Script pour voir les logs en temps réel

echo "📋 Logs FHIR Clustering"
echo ""
echo "Quelle service voulez-vous surveiller?"
echo "1) Backend"
echo "2) Worker"
echo "3) Redis"
echo "4) Ollama"
echo "5) Tous"
echo ""
read -p "Choix (1-5): " choice

case $choice in
  1)
    docker-compose logs -f backend
    ;;
  2)
    docker-compose logs -f worker
    ;;
  3)
    docker-compose logs -f redis
    ;;
  4)
    docker-compose logs -f ollama
    ;;
  5)
    docker-compose logs -f
    ;;
  *)
    echo "Choix invalide"
    exit 1
    ;;
esac
