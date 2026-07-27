# TECH_STACK.md

# Stack technique du projet

## Vue générale

L'application doit être développée avec une architecture moderne, gratuite et facilement déployable.

L'objectif est d'utiliser uniquement des services disposant d'un plan gratuit suffisant :

- Vercel
- Supabase
- GitHub


---

# Architecture globale


```
                    Users
                      |
                      |
                 Vercel CDN
                      |
                      |
              React PWA Frontend
                      |
                      |
          Vercel Serverless Functions
                      |
                      |
              Supabase Services
                      |
        -----------------------------
        |             |             |
   PostgreSQL     Auth          Storage
```


---

# Frontend


## Framework

React


## Build Tool

Vite


## Langage

TypeScript


## Styling

Tailwind CSS


## Routing

React Router


## Gestion des données

TanStack Query


Utilisation pour :

- appels API ;
- cache ;
- synchronisation ;
- états serveur.


---

# Formulaires


Utiliser :

## React Hook Form

Pour :

- formulaires complexes ;
- optimisation des performances ;
- gestion des erreurs.


## Zod

Pour :

- validation ;
- typage ;
- sécurité.


Exemple :

```
Nom obligatoire
Email valide
CIN avec format correct
Téléphone valide
```


---

# Internationalisation


Bibliothèque :

react-i18next


Support :

- Français
- العربية


Structure :

```
src/
 translations/

   fr/
     common.json

   ar/
     common.json
```


Gestion RTL :

```
<html dir="rtl">
```


pour l'arabe.


---

# UI / Design


Framework :

Tailwind CSS


Composants :

Créer une bibliothèque interne :

```
components/

Button
Input
Modal
Card
Table
Navbar
Sidebar
FormField
```

Les composants doivent être réutilisables.


---

# Icônes


Utiliser :

Lucide React


Avantages :

- léger ;
- moderne ;
- compatible React.


---

# Backend


## Architecture


Backend serverless avec :

Vercel Functions


Langage :

TypeScript


Framework :

Node.js


---

# API


Style :

REST API


Exemple :

```
GET /api/events

POST /api/events

PATCH /api/events/:id

DELETE /api/events/:id
```


---

# Base de données


Service :

Supabase PostgreSQL


ORM :

Prisma


Utilisation :

- migrations ;
- modèles ;
- relations ;
- requêtes sécurisées.


---

# Authentification


Service :

Supabase Auth


Fonctionnalités :

- inscription ;
- connexion ;
- récupération mot de passe ;
- gestion session.


Méthode :

JWT.


---

# Stockage fichiers


Service :

Supabase Storage


Utilisation :

- photos profils ;
- documents ;
- certificats ;
- signatures.


---

# Gestion des permissions


Système RBAC :

Role Based Access Control


Rôles :

```
USER

ADMIN
```


Les permissions doivent être vérifiées :

- frontend ;
- backend.


---

# Sécurité


Bibliothèques recommandées :


## Helmet

Protection HTTP.


## CORS

Gestion des origines.


## Zod

Validation entrées.


## bcrypt

Hashage des mots de passe.


## Rate limiting

Protection contre abus.


---

# PWA


L'application doit être installable.


Technologies :

- Web App Manifest
- Service Worker


Fonctionnalités :

- icône ;
- splash screen ;
- cache ;
- fonctionnement mobile.


---

# Tests


Frontend :

Vitest


Backend :

Vitest + Supertest


Tests nécessaires :

- authentification ;
- permissions ;
- création événement ;
- inscription activité ;
- validation formulaire.


---

# Qualité du code


Utiliser :

ESLint

Prettier


Convention :

- PascalCase composants React
- camelCase fonctions
- PascalCase classes


---

# Déploiement


## Frontend

Déploiement automatique :

GitHub → Vercel


## Backend

Déploiement :

GitHub → Vercel Functions


## Database

Supabase


Variables d'environnement :

```
DATABASE_URL

SUPABASE_URL

SUPABASE_KEY

JWT_SECRET
```


Ne jamais mettre de secrets dans Git.


---

# Contraintes budget


Le projet doit fonctionner avec :

$0 / mois


Services :

- Vercel Free
- Supabase Free


L'architecture doit rester compatible avec une évolution future vers des offres payantes.