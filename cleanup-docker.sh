#!/bin/bash

# Script de nettoyage Docker pour libérer de l'espace disque et mémoire
# Usage: ./cleanup-docker.sh [option]
# Options:
#   --soft     : Nettoyage léger (containers arrêtés et images non utilisées)
#   --hard     : Nettoyage complet (tout sauf volumes nommés)
#   --volumes  : Nettoie aussi les volumes (⚠️  supprime les données !)
#   --all      : Nettoyage total (⚠️  supprime TOUT)

set -e

echo "🧹 Script de nettoyage Docker pour FHIR Clustering"
echo ""

# Fonction pour afficher l'espace disque utilisé
show_disk_usage() {
    echo "📊 Espace Docker utilisé:"
    docker system df
    echo ""
}

# Fonction de nettoyage léger
soft_cleanup() {
    echo "🧹 Nettoyage léger..."
    echo ""
    
    # Supprimer les containers arrêtés
    echo "📦 Suppression des containers arrêtés..."
    docker container prune -f
    
    # Supprimer les images non utilisées (dangling)
    echo "🖼️  Suppression des images non taguées..."
    docker image prune -f
    
    # Supprimer les réseaux non utilisés
    echo "🌐 Suppression des réseaux non utilisés..."
    docker network prune -f
    
    echo ""
    echo "✅ Nettoyage léger terminé"
}

# Fonction de nettoyage complet (sans volumes)
hard_cleanup() {
    echo "🧹 Nettoyage complet (sans volumes)..."
    echo ""
    
    # Arrêter tous les containers de ce projet
    echo "🛑 Arrêt des containers du projet..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Supprimer TOUTES les images non utilisées
    echo "🖼️  Suppression de toutes les images non utilisées..."
    docker image prune -a -f
    
    # Supprimer tous les containers arrêtés
    echo "📦 Suppression de tous les containers arrêtés..."
    docker container prune -f
    
    # Supprimer tous les réseaux non utilisés
    echo "🌐 Suppression des réseaux non utilisés..."
    docker network prune -f
    
    # Supprimer le build cache
    echo "🗂️  Suppression du cache de build..."
    docker builder prune -f
    
    echo ""
    echo "✅ Nettoyage complet terminé (volumes préservés)"
}

# Fonction pour nettoyer les volumes
cleanup_volumes() {
    echo "⚠️  ATTENTION: Cette action supprimera les volumes Docker!"
    echo "   Cela inclut:"
    echo "   - Les modèles LLM téléchargés (ollama_models)"
    echo "   - Les résultats de clustering (backend_results)"
    echo ""
    read -p "Êtes-vous sûr? (tapez 'oui' pour confirmer): " confirm
    
    if [ "$confirm" = "oui" ]; then
        echo ""
        echo "🗑️  Suppression des volumes..."
        docker volume prune -f
        echo "✅ Volumes supprimés"
    else
        echo "❌ Annulé"
    fi
}

# Fonction de nettoyage total
total_cleanup() {
    echo "⚠️  ATTENTION: NETTOYAGE TOTAL!"
    echo "   Cela supprimera TOUT:"
    echo "   - Tous les containers"
    echo "   - Toutes les images"
    echo "   - Tous les volumes"
    echo "   - Tous les réseaux"
    echo "   - Tout le cache de build"
    echo ""
    read -p "Êtes-vous VRAIMENT sûr? (tapez 'SUPPRIMER' pour confirmer): " confirm
    
    if [ "$confirm" = "SUPPRIMER" ]; then
        echo ""
        echo "🗑️  Nettoyage total en cours..."
        docker-compose down -v 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
        docker system prune -a -f --volumes
        echo ""
        echo "✅ Nettoyage total terminé"
    else
        echo "❌ Annulé"
    fi
}

# Programme principal
show_disk_usage

case "${1:-}" in
    --soft)
        soft_cleanup
        ;;
    --hard)
        hard_cleanup
        ;;
    --volumes)
        cleanup_volumes
        ;;
    --all)
        total_cleanup
        ;;
    *)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --soft     : Nettoyage léger (recommandé régulièrement)"
        echo "  --hard     : Nettoyage complet sans volumes"
        echo "  --volumes  : Nettoie aussi les volumes (⚠️  supprime données)"
        echo "  --all      : Nettoyage total (⚠️  supprime TOUT)"
        echo ""
        echo "Pour un nettoyage quotidien, utilisez: $0 --soft"
        echo "Pour résoudre des problèmes d'images, utilisez: $0 --hard"
        echo ""
        exit 1
        ;;
esac

echo ""
show_disk_usage

echo ""
echo "💡 Conseils:"
echo "   • Lancez './cleanup-docker.sh --soft' régulièrement"
echo "   • Utilisez docker-compose.dev.yml en développement"
echo "   • Surveillez l'utilisation mémoire: docker stats"
