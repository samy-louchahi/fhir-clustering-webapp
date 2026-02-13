#!/bin/bash

# Script de vérification de l'installation et de la santé du système

echo "🔍 Vérification de l'installation FHIR Clustering"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérifier Docker
echo "1️⃣  Vérification de Docker..."
docker --version > /dev/null 2>&1
check $? "Docker installé"

docker ps > /dev/null 2>&1
check $? "Docker daemon actif"

# 2. Vérifier les services Docker
echo ""
echo "2️⃣  Vérification des services Docker..."

docker ps | grep -q fhir-redis
check $? "Redis en cours d'exécution"

docker ps | grep -q fhir-ollama
check $? "Ollama en cours d'exécution"

docker ps | grep -q fhir-backend
check $? "Backend en cours d'exécution"

# 3. Vérifier la connectivité des services
echo ""
echo "3️⃣  Vérification de la connectivité..."

curl -s http://localhost:8000/health > /dev/null
check $? "Backend API accessible (port 8000)"

curl -s http://localhost:11434 > /dev/null
check $? "Ollama accessible (port 11434)"

redis-cli -h localhost -p 6379 ping > /dev/null 2>&1 || docker exec fhir-redis redis-cli ping > /dev/null 2>&1
check $? "Redis accessible (port 6379)"

# 4. Vérifier le modèle LLM
echo ""
echo "4️⃣  Vérification du modèle LLM..."

if command -v ollama &> /dev/null; then
    ollama list | grep -q "llama3.1:8b"
    check $? "Modèle llama3.1:8b téléchargé (natif)"
else
    docker exec fhir-ollama ollama list 2>/dev/null | grep -q "llama3.1:8b"
    check $? "Modèle llama3.1:8b téléchargé (Docker)"
fi

# 5. Vérifier les dossiers requis
echo ""
echo "5️⃣  Vérification des dossiers..."

for dir in "fhir_clustering" "workflows" "terminology_omop" "data"; do
    if [ -d "$dir" ]; then
        check 0 "Dossier $dir présent"
    else
        check 1 "Dossier $dir présent"
        warn "   Copiez le dossier depuis votre POC original"
    fi
done

# 6. Vérifier Node.js et frontend
echo ""
echo "6️⃣  Vérification du frontend..."

if [ -d "frontend/node_modules" ]; then
    check 0 "Dépendances frontend installées"
else
    check 1 "Dépendances frontend installées"
    warn "   Exécutez: cd frontend && npm install"
fi

# 7. Vérifier les fichiers de configuration
echo ""
echo "7️⃣  Vérification des fichiers de configuration..."

[ -f "docker-compose.yml" ] && check 0 "docker-compose.yml" || check 1 "docker-compose.yml"
[ -f "backend/Dockerfile" ] && check 0 "backend/Dockerfile" || check 1 "backend/Dockerfile"
[ -f "frontend/package.json" ] && check 0 "frontend/package.json" || check 1 "frontend/package.json"

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 RÉSUMÉ"
echo ""

# Test final de l'API
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Système opérationnel !${NC}"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "   1. Démarrer le frontend: cd frontend && npm run dev"
    echo "   2. Ouvrir: http://localhost:5173"
    echo "   3. Documentation API: http://localhost:8000/docs"
else
    echo -e "${YELLOW}⚠️  Services partiellement opérationnels${NC}"
    echo ""
    echo "🔧 Actions recommandées:"
    echo "   1. Vérifier les logs: ./logs.sh"
    echo "   2. Redémarrer: docker-compose restart"
    echo "   3. Rebuild si nécessaire: docker-compose build --no-cache"
fi

echo ""
 3. Rebuild si nécessaire: docker-compose build --no-cache"
fi

echo ""
