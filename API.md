# API.md

# Documentation API


## Architecture

API REST développée avec :

- Vercel Functions
- TypeScript
- Supabase


Base URL :

```
/api
```


---

# Authentification


Toutes les routes privées utilisent :

```
Authorization: Bearer TOKEN
```


---

# Auth API


## Inscription


```
POST /api/auth/register
```


Body :

```json
{
 "email":"",
 "password":""
}
```


Réponse :

```json
{
 "message":"Account created"
}
```


---

## Connexion


```
POST /api/auth/login
```


Body :

```json
{
 "email":"",
 "password":""
}
```


---

## Utilisateur connecté


```
GET /api/auth/me
```


Retourne :

- utilisateur ;
- rôle ;
- profil.


---

# Users API


## Liste utilisateurs


ADMIN uniquement


```
GET /api/users
```


---

## Voir utilisateur


```
GET /api/users/:id
```


---

## Modifier utilisateur


```
PATCH /api/users/:id
```


---

## Bannir utilisateur


```
POST /api/users/:id/ban
```


Body :

```json
{
 "reason":""
}
```


---

## Supprimer utilisateur


```
DELETE /api/users/:id
```


---

# Member Profile API


## Voir profil


```
GET /api/profile
```


---

## Créer profil adhérent


```
POST /api/profile
```


---

## Modifier profil


```
PATCH /api/profile
```


---

# Events API


## Liste événements


```
GET /api/events
```


Query :

```
?page=1
&search=
```


---

## Détail événement


```
GET /api/events/:id
```


---

## Créer événement


ADMIN


```
POST /api/events
```


---

## Modifier événement


ADMIN


```
PATCH /api/events/:id
```


---

## Supprimer événement


ADMIN


```
DELETE /api/events/:id
```


---

# Registration API


## Inscription événement


```
POST /api/events/:id/register
```


---

## Annulation


```
DELETE /api/events/:id/register
```


---

## Participants


ADMIN


```
GET /api/events/:id/participants
```


---

# Payment API


## Liste paiements


ADMIN


```
GET /api/payments
```


---

## Valider paiement


```
PATCH /api/payments/:id
```


Body :

```json
{
"status":"VALIDATED"
}
```


---

# Upload API


## Upload document


```
POST /api/uploads
```


Types :

- image
- pdf


Stockage :

Supabase Storage


---

# Response format


Succès :

```json
{
"success":true,
"data":{}
}
```


Erreur :

```json
{
"success":false,
"error":"message"
}
```


---

# Codes HTTP


```
200 OK

201 CREATED

400 BAD REQUEST

401 UNAUTHORIZED

403 FORBIDDEN

404 NOT FOUND

500 SERVER ERROR
```