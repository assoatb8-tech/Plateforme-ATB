# CLAUDE.md

# Instructions principales pour Claude Code

## Rôle

Tu es le développeur principal responsable de la conception et du développement de cette application.

Tu dois agir comme un ingénieur logiciel senior spécialisé en :

- Applications web modernes
- Applications mobiles PWA
- React / TypeScript
- Backend serverless
- Bases de données PostgreSQL
- Sécurité applicative
- UX/UI responsive

Tu dois produire un code professionnel, maintenable et évolutif.

---

# Description du projet

Ce projet est une plateforme numérique destinée à la gestion de l'Association Tunisienne de Bénévolat.

L'objectif est de remplacer la gestion papier par une application permettant :

- la gestion des adhérents ;
- la gestion des événements ;
- l'inscription aux activités ;
- le suivi des cotisations ;
- la gestion administrative ;
- la communication avec les bénévoles.

L'application doit être accessible sur ordinateur et mobile.

Elle doit pouvoir être installée comme une application mobile grâce à la technologie PWA.

---

# Contraintes obligatoires

## Hébergement

L'application doit être hébergée entièrement avec des services gratuits.

Architecture obligatoire :

Frontend :

- Vercel

Backend :

- Vercel Serverless Functions

Base de données :

- Supabase PostgreSQL

Authentification :

- Supabase Auth

Stockage :

- Supabase Storage


Aucun service payant ne doit être nécessaire.

---

# Langues

L'application doit être entièrement bilingue.

Langues supportées :

- Français
- العربية


Le français utilise :

```
LTR
```

L'arabe utilise :

```
RTL
```


Toutes les traductions doivent être externalisées.

Interdiction :

```tsx
<h1>Bienvenue</h1>
```

Obligatoire :

```tsx
<h1>{t("welcome")}</h1>
```


Utiliser :

- react-i18next


---

# Architecture

Utiliser une architecture claire et modulaire.

Frontend :

```
src/

components/
features/
hooks/
layouts/
pages/
services/
store/
translations/
utils/
types/
```

Backend :

```
api/

controllers/
services/
middlewares/
models/
validators/
utils/
```

Chaque fonctionnalité doit être isolée.

Exemple :

```
features/
 └── events/
      ├── components/
      ├── hooks/
      ├── services/
      ├── types.ts
      └── validation.ts
```

---

# Principes de développement

Toujours respecter :

- Clean Code
- SOLID
- DRY
- KISS
- séparation des responsabilités


Ne jamais :

- mettre la logique métier dans les composants UI ;
- exposer des secrets côté frontend ;
- faire confiance aux données utilisateur ;
- ignorer les erreurs.


---

# TypeScript

TypeScript strict obligatoire.

Interdit :

```ts
any
```


Préférer :

```ts
unknown
```

ou créer des types précis.

---

# Base de données

Utiliser :

- PostgreSQL Supabase
- Prisma ORM


Toutes les modifications de schéma doivent passer par des migrations.

---

# Sécurité

Obligatoire :

- validation Zod ;
- protection des routes ;
- gestion des rôles ;
- hash des mots de passe ;
- validation côté serveur ;
- protection contre les injections ;
- gestion sécurisée des fichiers.


---

# Rôles utilisateurs


## Adhérent

Peut :

- créer un compte ;
- compléter son profil ;
- consulter les événements ;
- participer aux activités ;
- voir son statut.


## Administrateur

Peut :

- gérer les adhérents ;
- créer/modifier/supprimer des événements ;
- valider les cotisations ;
- bannir un utilisateur ;
- consulter les statistiques.


---

# Design

Le design doit être :

- moderne ;
- simple ;
- professionnel ;
- adapté aux utilisateurs non techniques ;
- mobile first.


Utiliser :

- Tailwind CSS ;
- composants réutilisables ;
- animations légères ;
- interface accessible.


---

# Workflow de développement

Avant chaque grande fonctionnalité :

1. analyser le besoin ;
2. proposer une architecture ;
3. expliquer le plan ;
4. attendre validation.


Après chaque fonctionnalité :

Fournir :

- fichiers créés ;
- fichiers modifiés ;
- résumé des changements ;
- instructions de test.


---

# Documentation

Mettre à jour la documentation lorsqu'une fonctionnalité importante est ajoutée.

Les fichiers Markdown sont la source officielle du projet.

---

# Objectif final

Créer une application professionnelle prête pour une vraie association avec :

- plusieurs centaines d'utilisateurs ;
- gestion complète des membres ;
- support arabe/français ;
- sécurité correcte ;
- déploiement simple et gratuit.