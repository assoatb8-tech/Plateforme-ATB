# DATABASE.md

# Modèle de base de données

## Vue générale

La base de données utilise :

- PostgreSQL via Supabase
- Prisma ORM
- Row Level Security (RLS) Supabase pour la protection des données


L'objectif est de gérer :

- les utilisateurs ;
- les profils adhérents ;
- les événements ;
- les inscriptions ;
- les cotisations ;
- les documents ;
- les permissions.


---

# Relations principales


```
User

 |
 |
 +---- MemberProfile

 |
 |
 +---- EventRegistration

 |
 |
 +---- Payment


Event

 |
 |
 +---- EventRegistration


Admin

 |
 |
 +---- AuditLog
```


---

# Table User


Cette table est gérée principalement par Supabase Auth.


## User


| Champ | Type | Description |
|-|-|-|
| id | UUID | Identifiant unique |
| email | String | Email utilisateur |
| role | Enum | USER / ADMIN |
| status | Enum | ACTIVE / BANNED / PENDING |
| createdAt | DateTime | Date création |
| updatedAt | DateTime | Dernière modification |


---

# Table MemberProfile


Contient toutes les informations administratives d'un adhérent.


## Informations personnelles


| Champ | Type |
|-|-|
| id | UUID |
| userId | UUID |
| firstName | String |
| lastName | String |
| gender | Enum |
| fatherName | String |
| grandfatherName | String |
| motherFullName | String |
| birthDate | Date |
| birthPlace | String |
| cinNumber | String |
| cinIssuedPlace | String |
| cinIssueDate | Date |


---

# Coordonnées


| Champ | Type |
|-|-|
| address | Text |
| phoneHome | String |
| phoneMobile | String |
| email | String |


---

# Informations personnelles complémentaires


| Champ | Type |
|-|-|
| maritalStatus | Enum |
| childrenCount | Integer |
| bloodType | Enum |
| educationLevel | String |


---

# Informations professionnelles


| Champ | Type |
|-|-|
| profession | String |
| speciality | String |
| employer | String |
| employerAddress | Text |
| employerPhone | String |
| workFax | String |


---

# Expérience associative


| Champ | Type |
|-|-|
| previousAssociations | Text |


---

# Activités


| Champ | Type |
|-|-|
| sports | Text |
| firstAidCertificates | Text |


---

# Déclaration


| Champ | Type |
|-|-|
| declarationAccepted | Boolean |
| signature | String |
| signatureDate | DateTime |
| createdAt | DateTime |
| updatedAt | DateTime |


---

# Table Event


Gestion des activités organisées par l'association.


## Event


| Champ | Type | Description |
|-|-|-|
| id | UUID | Identifiant |
| titleFr | String | Titre français |
| titleAr | String | Titre arabe |
| descriptionFr | Text | Description française |
| descriptionAr | Text | Description arabe |
| location | String | Lieu |
| startDate | DateTime | Début |
| endDate | DateTime | Fin |
| maxParticipants | Integer | Jauge maximale |
| status | Enum | ACTIVE / CANCELLED |
| createdBy | UUID | Admin créateur |
| createdAt | DateTime |
| updatedAt | DateTime |


---

# Table EventRegistration


Association entre adhérents et événements.


## EventRegistration


| Champ | Type |
|-|-|
| id | UUID |
| eventId | UUID |
| userId | UUID |
| status | Enum |
| registeredAt | DateTime |


Status possibles :

```
REGISTERED
CANCELLED
WAITING_LIST
```


---

# Table Payment


Gestion des cotisations.


## Payment


| Champ | Type |
|-|-|
| id | UUID |
| userId | UUID |
| amount | Decimal |
| paymentType | Enum |
| status | Enum |
| validatedBy | UUID |
| validatedAt | DateTime |
| createdAt | DateTime |


PaymentType :

```
MEMBERSHIP
DONATION
OTHER
```


Status :

```
PENDING
VALIDATED
REJECTED
```


---

# Table Documents


Stockage des documents des adhérents.


## Document


| Champ | Type |
|-|-|
| id | UUID |
| userId | UUID |
| type | Enum |
| url | String |
| uploadedAt | DateTime |


Types :

```
PROFILE_IMAGE

CIN_COPY

CERTIFICATE

OTHER
```


---

# Table Ban


Gestion des exclusions.


## Ban


| Champ | Type |
|-|-|
| id | UUID |
| userId | UUID |
| reason | Text |
| createdBy | UUID |
| createdAt | DateTime |


---

# Table AuditLog


Historique des actions administratives.


## AuditLog


| Champ | Type |
|-|-|
| id | UUID |
| adminId | UUID |
| action | String |
| targetId | UUID |
| createdAt | DateTime |


Exemples :

```
USER_BANNED

EVENT_CREATED

PAYMENT_VALIDATED
```


---

# Enumérations


## Role


```
USER

ADMIN
```


## Gender


```
MALE

FEMALE
```


## UserStatus


```
ACTIVE

PENDING

BANNED
```


## BloodType


```
A+

A-

B+

B-

AB+

AB-

O+

O-
```


---

# Sécurité base de données


Utiliser Supabase Row Level Security.


Règles :

## Utilisateur

Peut :

- voir son profil ;
- modifier ses informations personnelles ;
- voir ses inscriptions.


## Administrateur

Peut :

- voir tous les membres ;
- modifier les profils ;
- gérer événements ;
- gérer paiements.


---

# Index nécessaires


Créer des index sur :

```
User.email

MemberProfile.cinNumber

Event.startDate

EventRegistration.eventId

EventRegistration.userId
```


---

# Migrations


Toutes les modifications doivent utiliser Prisma migrations.


Exemple :

```
npx prisma migrate dev
```


Ne jamais modifier directement la base de production.