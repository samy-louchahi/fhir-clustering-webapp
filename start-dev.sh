#!/bin/bash

# 🚀 Script de démarrage pour le MODE DÉVELOPPEMENT
# - Hot-reload activé (pas besoin de rebuild)
# - Utilise moins de mémoire
# - Monte le code en volumes

echo "🏥 FHIR Clustering - Démarrage MODE DÉVELOPPEMENT"
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
echo "💡 Mode développement:"
echo "   • Hot-reload activé ✓"
echo "   • Code monté en volumes ✓"
echo "   • Pas besoin de rebuild ✓"
echo ""

# Vérifier si des containers existent déjà
if docker ps -a | grep -q "fhir-.*-dev"; then
    echo "⚠️  Des containers de dev existent déjà"
    read -p "Voulez-vous les supprimer et redémarrer? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo "🛑 Arrêt et suppression des anciens containers..."
        docker-compose -f docker-compose.dev.yml down
    else
        echo "ℹ️  Démarrage avec les containers existants..."
    fi
fi

echo ""
echo "📦 Démarrage des services (mode développement)..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier que les services sont en cours d'exécution
if ! docker ps | grep -q "fhir-backend-dev"; then
    echo "❌ Le backend n'a pas démarré correctement"
    echo "Consultez les logs: docker-compose -f docker-compose.dev.yml logs backend"
    exit 1
fi

echo ""
echo "📦 Téléchargement du modèle LLM si nécessaire..."
docker exec fhir-ollama-dev ollama pull qwen2.5:3b-instruct

echo ""
echo "✅ Services démarrés en mode développement!"
echo ""
echo "🌐 URLs:"
echo "   • Backend API: http://localhost:8000"
echo "   • Documentation API: http://localhost:8000/docs"
echo "   • Redis: localhost:6379"
echo "   • Ollama: http://localhost:11434"
echo ""
echo "📊 Commandes utiles:"
echo "   • Voir les logs: docker-compose -f docker-compose.dev.yml logs -f backend"
echo "   • Arrêter: docker-compose -f docker-compose.dev.yml down"
echo "   • Redémarrer backend: docker-compose -f docker-compose.dev.yml restart backend"
echo "   • Surveiller la mémoire: docker stats"
echo ""
echo "💡 Vos modifications de code sont automatiquement détectées!"
echo "   Le serveur redémarre automatiquement à chaque changement."
echo ""
echo "🎯 Lancez maintenant le frontend:"
echo "   cd frontend && npm run dev"
