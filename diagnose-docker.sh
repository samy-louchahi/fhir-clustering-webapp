#!/bin/bash

# Script de diagnostic Docker pour FHIR Clustering
# Affiche toutes les informations utiles pour diagnostiquer les problèmes

echo "📊 Diagnostic Docker pour FHIR Clustering"
echo "=========================================="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

echo "✅ Docker installé"
echo ""

echo "=== 📦 Version Docker ==="
docker --version
docker-compose --version
echo ""

echo "=== 💾 Ressources Docker ==="
docker info | grep -E "(CPUs|Total Memory|Server Version|Operating System)" 2>/dev/null || echo "Impossible de récupérer les infos"
echo ""

echo "=== 💿 Utilisation disque ==="
docker system df
echo ""

echo "=== 🏃 Containers en cours d'exécution ==="
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "fhir"; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|fhir)"
else
    echo "Aucun container FHIR en cours d'exécution"
fi
echo ""

echo "=== 📈 Utilisation mémoire des containers ==="
if docker ps -q | grep -q .; then
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
else
    echo "Aucun container en cours d'exécution"
fi
echo ""

echo "=== 🖼️  Images Docker (top 10) ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -n 11
echo ""

echo "=== 🗄️  Volumes Docker ==="
docker volume ls --format "table {{.Driver}}\t{{.Name}}" | grep -E "(DRIVER|ollama|backend|fhir)" || echo "Aucun volume FHIR trouvé"
echo ""

echo "=== 🌐 Réseaux Docker ==="
docker network ls --format "table {{.Name}}\t{{.Driver}}" | grep -E "(NAME|fhir)" || echo "Aucun réseau FHIR trouvé"
echo ""

# Détection du mode
echo "=== 🎯 Mode détecté ==="
if docker ps | grep -q "fhir-.*-dev"; then
    echo "✅ Mode DÉVELOPPEMENT actif"
    COMPOSE_FILE="docker-compose.dev.yml"
elif docker ps | grep -q "fhir-backend"; then
    echo "✅ Mode PRODUCTION actif"
    COMPOSE_FILE="docker-compose.yml"
else
    echo "⚠️  Aucun container FHIR actif"
    COMPOSE_FILE=""
fi
echo ""

# Logs récents si des containers tournent
if [ -n "$COMPOSE_FILE" ] && docker ps | grep -q "fhir"; then
    echo "=== 📝 Dernières lignes des logs ==="
    echo "Backend:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=5 backend 2>/dev/null || echo "Impossible de récupérer les logs"
    echo ""
fi

# Vérification de la santé
echo "=== ❤️  Healthcheck des services ==="
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "healthy"; then
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAMES|fhir)"
else
    echo "En attente du healthcheck..."
fi
echo ""

# Recommandations
echo "=== 💡 Recommandations ==="
IMAGES_SIZE=$(docker system df --format "{{.Size}}" | head -n 1)
echo "• Espace utilisé par les images: $IMAGES_SIZE"

if docker system df | grep -q "Local Volumes.*[5-9][0-9][0-9]MB\|[0-9]GB"; then
    echo "⚠️  Beaucoup d'espace utilisé par les volumes"
    echo "  → Considérez: ./cleanup-docker.sh --volumes (⚠️  supprime les données)"
fi

if docker ps -a | wc -l | grep -q "[3-9][0-9]\|[0-9][0-9][0-9]"; then
    echo "⚠️  Beaucoup de containers présents"
    echo "  → Recommandation: ./cleanup-docker.sh --soft"
fi

if docker images | wc -l | grep -q "[2-9][0-9]\|[0-9][0-9][0-9]"; then
    echo "⚠️  Beaucoup d'images Docker"
    echo "  → Recommandation: ./cleanup-docker.sh --hard"
fi

echo ""
echo "=== ⚡ Commandes rapides ==="
echo "• Voir les logs en temps réel:"
if [ "$COMPOSE_FILE" = "docker-compose.dev.yml" ]; then
    echo "    docker-compose -f docker-compose.dev.yml logs -f backend"
else
    echo "    docker-compose logs -f backend"
fi
echo "• Surveiller la mémoire en temps réel:"
echo "    docker stats"
echo "• Nettoyer Docker:"
echo "    ./cleanup-docker.sh --soft"
echo "• Arrêter tous les services:"
echo "    ./stop.sh"
echo ""

echo "✅ Diagnostic terminé"
