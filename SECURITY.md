# SECURITY.md

# Sécurité de l'application


## Objectif

Protéger les données personnelles des adhérents.

Les informations collectées sont sensibles :

- identité ;
- CIN ;
- adresse ;
- informations professionnelles.


---

# Authentification


Utiliser :

Supabase Auth


Fonctions :

- inscription ;
- connexion ;
- récupération mot de passe.


Les mots de passe ne doivent jamais être stockés directement.


---

# Autorisation


Utiliser RBAC.


Rôles :

```
USER

ADMIN
```


---

# Permissions


## USER


Peut :

- voir son profil ;
- modifier ses informations ;
- gérer ses inscriptions.


Ne peut pas :

- voir les autres membres ;
- accéder aux fonctions admin.


---

## ADMIN


Peut :

- gérer utilisateurs ;
- gérer événements ;
- valider paiements.


---

# Validation des données


Toutes les entrées doivent être validées avec Zod.


Validation :

- frontend ;
- backend.


Jamais faire confiance au frontend.


---

# Protection API


Mettre en place :

- rate limiting ;
- validation JWT ;
- contrôle permissions.


---

# Base de données


Utiliser :

Supabase Row Level Security.


Règles :

Utilisateur :

- accès uniquement à ses données.


Administrateur :

- accès contrôlé.


---

# Protection fichiers


Les uploads doivent vérifier :

- type fichier ;
- taille ;
- extension.


Extensions autorisées :

```
jpg

png

pdf
```


---

# Secrets


Interdit :

mettre dans Git :

```
.env
```


Variables :

```
SUPABASE_KEY

DATABASE_URL

JWT_SECRET
```


---

# Logs


Les logs ne doivent jamais contenir :

- mot de passe ;
- CIN ;
- token ;
- données privées.


---

# Audit


Les actions administratives doivent être enregistrées.


Exemples :

- suppression membre ;
- bannissement ;
- validation paiement.


---

# RGPD / Protection données


Prévoir :

- suppression compte ;
- export données ;
- limitation accès.


---

# Sauvegarde


Utiliser :

- sauvegardes Supabase ;
- export régulier base.