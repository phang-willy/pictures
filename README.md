# Starter Fullstack

Starter fullstack prêt pour la production avec un workflow local orienté Docker.

## Stack

- Frontend : Next.js 16 (`apps/frontend`)
- Backend : NestJS 11 + Prisma 7 (`apps/backend`)
- Base de données : PostgreSQL 17
- Interface DB : Adminer
- Orchestration : Docker Compose

## Structure du dépôt

```text
.
├─ apps/
│  ├─ frontend/
│  └─ backend/
├─ shared/
├─ compose.yml
├─ .env
└─ .env.exemple
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
- Backend (health) : `http://localhost:3001/api/health`
- Swagger : `http://localhost:3001/api/docs` (activation : section **Backend** → *Politique Swagger*)
- Adminer : `http://localhost:8080`

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
- Les watchers frontend/backend utilisent le polling via `compose.yml`.
- Les dépendances sont installées au démarrage uniquement si `package-lock.json` change (fichier `.deps-lock-hash`).

### Commandes Docker courantes

```bash
# Démarrer les services
docker compose up -d

# Rebuild des images + redémarrage
docker compose up -d --build

# Voir les logs en continu
docker compose logs -f front
docker compose logs -f back

# Arrêter les services
docker compose down

# Rebuild une image et redémarre un service spécifique
docker compose up -d --build NOM_DU_SERVICE
```

## Backend (`apps/backend`)

### Scripts

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

### Prisma 7

- Schéma : `apps/backend/prisma/schema.prisma`
- Configuration Prisma CLI : `apps/backend/prisma.config.ts`
- Intégration du service Prisma : `apps/backend/prisma/prisma.service.ts`

Commandes utiles :

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db push
npm run seed
```

### Politique Swagger

`NODE_ENV=production`
- Swagger est désactivée

`NODE_ENV=development`
- Swagger est activé
- http://localhost:{BACKEND_PORT}/api/docs

## Frontend (`apps/frontend`)

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
  - Vérifier les logs : `docker compose logs -f front`
- Changement backend non visible :
  - Vérifier les logs : `docker compose logs -f back`
  - Vérifier l'état des conteneurs : `docker compose ps`
- Reset complet :

```bash
docker compose down
docker compose up -d --build
```
