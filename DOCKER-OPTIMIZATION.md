# 🛠️ Guide d'Optimisation Mémoire et Développement

Ce guide explique les optimisations mises en place pour éviter les problèmes de mémoire et faciliter le développement.

## 📊 Problèmes résolus

### Avant les optimisations
- ❌ Consommation mémoire excessive (jusqu'à saturation du système)
- ❌ Rebuild de l'image nécessaire à chaque modification du code
- ❌ Images Docker très volumineuses (plusieurs Go)
- ❌ Données copiées dans l'image au lieu d'utiliser des volumes
- ❌ Aucune limite de ressources sur les containers

### Après les optimisations
- ✅ Limites mémoire strictes sur tous les services
- ✅ Hot-reload en développement (pas de rebuild)
- ✅ Images légères (données en volumes)
- ✅ Redis configuré pour limiter sa mémoire
- ✅ Ollama configuré pour un seul modèle à la fois
- ✅ Mode développement séparé du mode production

## 🎯 Deux modes d'utilisation

### Mode Production (`docker-compose.yml`)
**Pour:** Déploiement, tests finaux
**Commande:** `./start.sh`

- Build d'une image optimisée
- Données montées en volumes (pas dans l'image)
- Limites mémoire:
  - Redis: 256 Mo max
  - Backend: 2 Go max
  - Ollama: 4 Go max

### Mode Développement (`docker-compose.dev.yml`)
**Pour:** Développement quotidien
**Commande:** `./start-dev.sh`

- Pas de rebuild nécessaire
- Hot-reload automatique sur changements de code
- Code monté en temps réel via volumes
- Mêmes limites mémoire qu'en production

## 🚀 Commandes principales

```bash
# Démarrer en mode développement (recommandé)
./start-dev.sh

# Démarrer en mode production
./start.sh

# Arrêter tous les services
./stop.sh

# Nettoyer Docker (libérer de l'espace)
./cleanup-docker.sh --soft      # Nettoyage léger (quotidien)
./cleanup-docker.sh --hard      # Nettoyage complet (sans volumes)
./cleanup-docker.sh --volumes   # Nettoie aussi les volumes
./cleanup-docker.sh --all       # ⚠️ Supprime TOUT

# Surveiller l'utilisation mémoire en temps réel
docker stats

# Voir les logs
docker-compose logs -f backend                    # Mode production
docker-compose -f docker-compose.dev.yml logs -f backend  # Mode dev
```

## 🧹 Maintenance régulière

### Quotidiennement
```bash
# Nettoyer les ressources Docker inutilisées
./cleanup-docker.sh --soft
```

### Hebdomadairement
```bash
# Vérifier l'espace disque utilisé
docker system df

# Si trop d'espace utilisé
./cleanup-docker.sh --hard
```

### En cas de problème
```bash
# Arrêter tout
./stop.sh

# Nettoyer complètement
./cleanup-docker.sh --hard

# Redémarrer
./start-dev.sh  # ou ./start.sh
```

## 📈 Limites de mémoire configurées

| Service | Mémoire minimum | Mémoire maximum |
|---------|----------------|-----------------|
| Redis   | 128 Mo         | 256 Mo          |
| Backend | 512 Mo         | 2 Go            |
| Ollama  | 2 Go           | 4 Go            |
| **Total** | **~2.6 Go**  | **~6.3 Go**    |

## 💡 Bonnes pratiques

### En développement
1. **Toujours utiliser `start-dev.sh`** pour bénéficier du hot-reload
2. **Ne pas rebuild** après chaque modification de code
3. **Surveiller la mémoire** avec `docker stats` si l'application ralentit
4. **Nettoyer régulièrement** avec `./cleanup-docker.sh --soft`

### Modifications du code
- ✅ Backend Python: hot-reload automatique
- ✅ Workflows: redémarrer le backend avec `docker-compose -f docker-compose.dev.yml restart backend`
- ❌ Dépendances (requirements.txt): nécessite un rebuild

### Si vous devez rebuild
```bash
# Arrêter
./stop.sh

# Nettoyer l'ancienne image
./cleanup-docker.sh --hard

# Redémarrer (rebuild automatique)
./start-dev.sh  # ou ./start.sh
```

## 🔧 Configuration avancée

### Ajuster les limites mémoire
Éditez `docker-compose.yml` ou `docker-compose.dev.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G    # Maximum
    reservations:
      memory: 512M  # Minimum réservé
```

### Réduire encore plus la mémoire Ollama
Dans `docker-compose.yml`:

```yaml
ollama:
  environment:
    - OLLAMA_MAX_LOADED_MODELS=1  # Déjà configuré
    - OLLAMA_NUM_PARALLEL=1       # Déjà configuré
  deploy:
    resources:
      limits:
        memory: 2G  # Réduire de 4G à 2G (peut ralentir)
```

## 🐛 Résolution de problèmes

### "Out of memory" sur Mac
1. Augmenter la mémoire allouée à Docker Desktop:
   - Docker Desktop → Préférences → Resources
   - RAM: minimum 8 Go recommandés
   - Appliquer et redémarrer

2. Vérifier les services en cours:
   ```bash
   docker stats
   ```

3. Si un service consomme trop:
   ```bash
   # Redémarrer le service spécifique
   docker-compose restart backend  # ou ollama, redis
   ```

### Backend ne redémarre pas automatiquement
En mode dev, c'est normal. Le hot-reload d'uvicorn détecte les changements:

```bash
# Voir les logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Image trop volumineuse
```bash
# Vérifier la taille
docker images | grep fhir-clustering-webapp

# Si > 1 Go, c'est anormal. Rebuild proprement:
./cleanup-docker.sh --hard
./start.sh
```

### "Cannot connect to Redis/Ollama"
Les services mettent du temps à démarrer:

```bash
# Attendre que tout soit prêt
docker-compose logs redis ollama

# Vérifier le healthcheck
docker ps
```

## 📚 Ressources

- [Docker: best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose: resource constraints](https://docs.docker.com/compose/compose-file/deploy/)
- [FastAPI: Deployment](https://fastapi.tiangolo.com/deployment/docker/)

## ❓ Questions fréquentes

**Q: Dois-je toujours utiliser le mode dev?**
R: Oui, pour le développement quotidien. Utilisez le mode production uniquement pour les tests finaux.

**Q: Les limites mémoire ralentissent-elles l'application?**
R: Non, elles empêchent juste la surconsommation. Si vous atteignez les limites, ajustez-les vers le haut.

**Q: Que fait `cleanup-docker.sh --soft` exactement?**
R: Supprime les containers arrêtés, images non utilisées, et réseaux orphelins. Sans danger.

**Q: Comment voir combien de mémoire j'ai libéré?**
R: Lancez `docker system df` avant et après le nettoyage.

**Q: Puis-je utiliser GPU avec Ollama?**
R: Oui, décommentez la section GPU dans `docker-compose.yml` (Linux + NVIDIA uniquement).
