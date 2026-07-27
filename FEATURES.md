# FEATURES.md

# Fonctionnalités de l'application

## Vue générale

L'application permet de gérer entièrement l'Association Tunisienne de Bénévolat :

- les adhérents ;
- les événements ;
- les inscriptions ;
- les cotisations ;
- les documents ;
- l'administration.


Les fonctionnalités sont divisées par rôle :

- Visiteur
- Adhérent
- Administrateur


---

# 1. Fonctionnalités publiques


## Page d'accueil

Objectifs :

- présenter l'association ;
- expliquer sa mission ;
- encourager l'inscription.


Contenu :

- présentation ;
- valeurs ;
- activités ;
- statistiques ;
- contact.


Support :

- Français
- العربية


---

## Authentification


### Inscription


Un utilisateur peut créer un compte.


Informations :

- email ;
- mot de passe ;
- confirmation mot de passe.


Après inscription :

- création du compte Supabase Auth ;
- création du profil utilisateur ;
- redirection vers le formulaire d'adhésion.


---

### Connexion


Fonctionnalités :

- email + mot de passe ;
- gestion session ;
- déconnexion.


---

### Mot de passe oublié


Permet :

- réinitialisation sécurisée ;
- envoi email Supabase.


---

# 2. Fonctionnalités adhérent


# Dashboard adhérent


Afficher :

- état du dossier ;
- statut adhésion ;
- prochains événements ;
- notifications.


---

# Profil personnel


L'adhérent peut :

- consulter ses informations ;
- modifier ses données ;
- ajouter une photo.


Informations :

- identité ;
- contact ;
- profession ;
- formations ;
- expériences.


---

# Formulaire d'adhésion


Fonctionnalités :

- formulaire multi-étapes ;
- sauvegarde automatique ;
- validation en temps réel ;
- progression.


Étapes :

1. Informations personnelles
2. Identité
3. Coordonnées
4. Situation familiale
5. Profession
6. Expérience
7. Documents
8. Déclaration


---

# Documents


L'adhérent peut envoyer :

- photo ;
- copie CIN ;
- certificats ;
- documents associatifs.


Stockage :

Supabase Storage


---

# Événements


L'adhérent peut :

- consulter les activités ;
- rechercher un événement ;
- voir les détails ;
- s'inscrire ;
- annuler son inscription.


Informations événement :

- titre ;
- description ;
- date ;
- lieu ;
- nombre de places.


---

# Mes participations


Afficher :

- événements passés ;
- événements futurs ;
- statut inscription.


---

# 3. Fonctionnalités administrateur


# Dashboard administrateur


Statistiques :

- nombre total adhérents ;
- nouveaux adhérents ;
- événements actifs ;
- inscriptions ;
- cotisations.


---

# Gestion des adhérents


L'administrateur peut :

- voir la liste des membres ;
- rechercher ;
- filtrer ;
- consulter un dossier ;
- modifier certaines informations.


Filtres :

- statut ;
- date inscription ;
- cotisation.


---

# Gestion des comptes


Actions :

- activer un compte ;
- suspendre ;
- bannir ;
- supprimer.


Chaque action doit être enregistrée.


---

# Gestion des événements


Créer :

- titre français ;
- titre arabe ;
- description ;
- date ;
- lieu ;
- capacité.


Modifier :

- informations ;
- capacité ;
- statut.


Supprimer :

- événement annulé.


---

# Gestion inscriptions


Administrateur peut :

- voir participants ;
- exporter liste ;
- retirer un participant.


---

# Gestion cotisations


Fonctionnalités :

- voir paiements ;
- valider une cotisation ;
- refuser une validation ;
- historique.


---

# Notifications


Prévu :

- notification email ;
- notification application.


Exemples :

- inscription événement ;
- validation compte ;
- rappel activité.


---

# 4. Fonctionnalités futures


## Carte membre numérique

Générer :

- QR code ;
- identité membre.


---

## Présence événements

Scanner QR code.


---

## Messagerie interne


Communication :

- administration → membres.


---

## Statistiques avancées


Rapports :

- participation ;
- évolution membres ;
- activités populaires.