#!/bin/bash

# 🚀 Script de démarrage rapide pour FHIR Clustering Web App

echo "🏥 FHIR Clustering - Démarrage..."
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installez Docker Desktop."
    exit 1
fi

echo "✅ Docker détecté"

# Vérifier les dossiers requis
REQUIRED_DIRS=("fhir_clustering" "workflows" "terminology_omop" "data")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "⚠️  Dossier manquant: $dir"
        echo "   Assurez-vous d'avoir copié les dossiers du POC original"
    fi
done

# Créer dossier results
mkdir -p results

echo ""
echo "📦 Téléchargement du modèle LLM (Llama 3.1:8b)..."
echo "   Cela peut prendre 5-10 minutes..."

# Option 1: Ollama natif (si installé)
if command -v ollama &> /dev/null; then
    echo "   Utilisation d'Ollama natif..."
    ollama pull llama3.1:8b
else
    echo "   Utilisation d'Ollama via Docker..."
    docker-compose up -d ollama
    sleep 10
    docker-compose exec ollama ollama pull llama3.1:8b
fi

echo ""
echo "🐳 Démarrage des services Docker..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage des services (30s)..."
sleep 30

echo ""
echo "🔍 Vérification de l'API backend..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend opérationnel"
else
    echo "⚠️  Backend non accessible, vérifiez les logs:"
    echo "   docker-compose logs backend"
fi


echo ""
echo "✅ Installation terminée !"
echo ""
echo "📍 Prochaines étapes:"
echo ""
echo "1. Démarrer le frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "2. Ouvrir l'application:"
echo "   http://localhost:5173"
echo ""
echo "3. Vérifier l'API:"
echo "   http://localhost:8000/docs"
echo ""
echo "4. Voir les logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f worker"
echo ""
echo "🎉 Bon clustering !"
