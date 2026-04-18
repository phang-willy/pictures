# Starter Fullstack

Starter fullstack prêt pour la production avec un workflow local orienté Docker.

## Stack

- Frontend : Next.js 16 (`infrastructure/frameworks/frontend/next`)
- Backend : NestJS 11 + Prisma 7 (code dans `infrastructure/frameworks/backend`)
- Base de données : PostgreSQL 17
- Interface DB : Adminer
- Orchestration : Docker Compose

## Structure du dépôt

```text
.
├─ .githooks
├─ .github
├─ application
├─ domain
├─ infrastructure/
│  └─ frameworks/
│     ├─ frontend/next/
│     └─ backend/
├─ packages /
├─ shared/
├─ .env
├─ .env.exemple
├─ .gitignore
├─ .nvmrc
├─ compose.yml
├─ .import_map.json
└─ tsconfig.json
```

## Prérequis

- Docker Desktop (Windows/macOS) ou Docker Engine (Linux)
- Docker Compose v2

## Démarrage rapide

1. Créer le fichier d'environnement local :

```bash
cp .env.exemple .env
```

2. Démarrer toute la stack :

```bash
docker compose up -d --build
```

3. Accéder aux services :
- Frontend : `http://localhost:3000`
- Adminer : `http://localhost:8080`
- Maildev : `http://localhost:1080`
- Backend (si lancé séparément) : `http://localhost:3001/api/health`
- Swagger (si backend lancé séparément) : `http://localhost:3001/api/docs`

4. Lancer le backend local (hors compose) :

```bash
cd infrastructure/frameworks/backend
npm install
npm run test
```

## Configuration des variables d'environnement

Tous les services lisent les variables depuis le `.env` à la racine.

Variables principales :
- `NODE_ENV`
- `FRONTEND_PORT`
- `BACKEND_PORT`
- `POSTGRES_PORT`
- `ADMINER_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `CORS_ORIGIN`
- `ALLOWED_DEV_ORIGINS` (liste séparée par des virgules)

Exemple :

```env
ALLOWED_DEV_ORIGINS=192.168.1.2,192.168.1.10
```

## Workflow de développement

### Rechargement à chaud avec Docker

Le projet est configuré pour un file watching fiable dans Docker (notamment sous Windows) :
- Le frontend tourne en mode développement webpack.
- Les watchers frontend utilisent le polling via `compose.yml`.
- Les dépendances sont installées au démarrage uniquement si `package-lock.json` change (fichier `.deps-lock-hash`).

### Commandes Docker courantes

```bash
# Démarrer les services
docker compose up -d

# Rebuild des images + redémarrage
docker compose up -d --build

# Voir les logs en continu
docker compose logs -f frontend
docker compose logs -f db

# Arrêter les services
docker compose down

# Rebuild une image et redémarre un service spécifique
docker compose up -d --build NOM_DU_SERVICE
```

## Backend (`infrastructure/frameworks/backend`)

### Scripts

```bash
npm run start
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Nest + Prisma

- Bootstrap Nest : `infrastructure/frameworks/backend/main.ts`
- Module principal : `infrastructure/frameworks/backend/app.module.ts`
- Prisma service : `infrastructure/database/config/prisma.service.ts`
- Prisma module : `infrastructure/database/config/prisma.module.ts`

Commandes utiles :

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db push
```

### Politique Swagger

`NODE_ENV=production`
- Swagger est désactivée

`NODE_ENV=development`
- Swagger est activé
- http://localhost:{BACKEND_PORT}/api/docs

## Frontend (`infrastructure/frameworks/frontend/next`)

### Scripts

```bash
npm run dev
npm run build
npm run lint
```

`allowedDevOrigins` est alimenté depuis `ALLOWED_DEV_ORIGINS` dans `.env`.

## CI/CD et hooks Git

- Les workflows CI/CD sont dans `.github/workflows`
- Activation des hooks locaux :

```bash
bash .github/scripts/setup-hooks.sh
```

Le hook `pre-push` exécute les checks frontend et backend avant chaque push.

## Dépannage

- Changement frontend non visible :
  - Utiliser `http://localhost:3000`
  - Faire un hard refresh du navigateur
  - Vérifier les logs : `docker compose logs -f frontend`
- Changement backend non visible :
  - Vérifier les logs du process backend local (hors docker compose)
  - Vérifier l'état des conteneurs : `docker compose ps`
- Reset complet :

```bash
docker compose down
docker compose up -d --build
```
