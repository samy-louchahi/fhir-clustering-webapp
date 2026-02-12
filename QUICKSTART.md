# ⚡ Quick Start Guide

## 🚀 Démarrage en 5 minutes

### Option 1 : Script automatique (recommandé)

```bash
./start.sh
```

Le script va :
- ✅ Vérifier Docker
- ✅ Télécharger le modèle LLM (Llama 3.1:8b)
- ✅ Démarrer tous les services Docker
- ✅ Installer les dépendances frontend

Puis :

```bash
cd frontend
npm run dev
```

Ouvrir **http://localhost:5173**

---

### Option 2 : Manuel

#### 1. Télécharger le modèle LLM

**Mac/Linux avec Ollama :**
```bash
brew install ollama
ollama pull llama3.1:8b
```

**Docker :**
```bash
docker-compose up -d ollama
docker-compose exec ollama ollama pull llama3.1:8b
```

#### 2. Démarrer le backend

```bash
docker-compose up -d
```

Vérifier : `curl http://localhost:8000/health`

#### 3. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir : **http://localhost:5173**

---

## ✅ Checklist de validation

- [ ] Docker Desktop est lancé
- [ ] `curl http://localhost:8000/health` retourne `{"status": "healthy"}`
- [ ] `curl http://localhost:11434` retourne OK
- [ ] `http://localhost:5173` affiche l'interface
- [ ] Logs backend OK : `docker-compose logs backend`
- [ ] Logs worker OK : `docker-compose logs worker`

---

## 🎯 Premier test

1. Ouvrir **http://localhost:5173**
2. Remplir le formulaire :
   - Mode : `domain_rollup`
   - Composantes : `30`
3. Cliquer **Lancer le Clustering**
4. Suivre la progression en temps réel
5. Une fois terminé, cliquer **Générer Rapport LLM** sur un cluster

---

## 🐛 Problèmes courants

### Backend ne démarre pas
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f backend
```

### Worker ne démarre pas
```bash
docker-compose restart worker
docker-compose logs -f worker
```

### Ollama ne répond pas
```bash
docker-compose restart ollama
docker-compose exec ollama ollama list
# Doit afficher: llama3.1:8b
```

### Frontend erreur de connexion
```bash
# Vérifier que l'API tourne
curl http://localhost:8000/health

# Vérifier le proxy dans vite.config.ts
```

---

## 📚 Prochaines étapes

- Lire le [README.md](README.md) complet
- Explorer l'API : http://localhost:8000/docs
- Consulter les logs : `docker-compose logs -f`
- Modifier le code et voir le hot-reload en action

---

**Bon clustering ! 🎉**
