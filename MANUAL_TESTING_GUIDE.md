# Guide de test manuel — ATB

Ce guide accompagne l'audit QA du 2026-07-31. Les identifiants des deux
comptes permanents sont dans `PRODUCTION_CREDENTIALS.md` (non versionné,
à la racine du projet).

URL de production : https://plateforme-atb.vercel.app

---

## Parcours Administrateur

### 1. Connexion
- **Action** : aller sur `/connexion`, entrer l'email et le mot de passe admin, cliquer "Se connecter".
- **Résultat attendu** : redirection automatique (le compte admin n'a pas de dossier d'adhésion, donc il atterrit sur `/dossier-adhesion` — c'est normal pour ce compte, à ignorer et naviguer directement vers `/admin`).
- **Vérifier** : la barre de navigation affiche "Administration" et "Déconnexion", pas "Connexion"/"Devenir bénévole".

### 2. Tableau de bord admin
- **Action** : aller sur `/admin`.
- **Résultat attendu** : 4 statistiques (Adhérents au total, Nouveaux adhérents, Événements actifs, Inscriptions).
- **Vérifier** : les nombres correspondent à l'état réel de la base (0 partout sur une base fraîchement nettoyée, sauf le nombre d'adhérents qui inclut les comptes créés).

### 3. Gestion des membres
- **Action** : aller sur `/admin/membres`.
- **Résultat attendu** : liste des adhérents avec nom, email, statut, date d'inscription. Recherche et filtre par statut fonctionnels.
- **Action** : cliquer sur un adhérent.
- **Résultat attendu** : page détail avec informations du dossier, sélecteur de statut (Actif / En attente / Suspendu), bouton "Bannir", bouton "Supprimer le compte".
- **Vérifier** : changer le statut vers "Actif" se reflète immédiatement dans le tableau et dans le compte de l'adhérent (visible à sa prochaine connexion/rafraîchissement).

### 4. Gestion des événements
- **Action** : aller sur `/admin/evenements`, cliquer "Créer un événement".
- **Remplir** : titre FR/AR, description FR/AR, lieu, date de début, date de fin, nombre de places, lien Facebook (optionnel).
- **Résultat attendu** : après soumission, redirection vers la liste avec le nouvel événement affiché, statut "Actif".
- **Vérifier** : l'événement apparaît immédiatement sur `/evenements` (page publique) dans l'onglet "À venir".
- **Action** : modifier l'événement, changer une date pour le passé.
- **Résultat attendu** : l'événement bascule automatiquement dans l'onglet "Précédents" côté public, et les boutons d'inscription disparaissent sur sa page détail.

### 5. Gestion des sponsors
- **Action** : aller sur `/admin/sponsors`, cliquer "Ajouter un sponsor".
- **Remplir** : nom + sélectionner un fichier image (PNG/JPEG/WEBP/SVG, max 2 Mo) — pas de champ URL, uniquement un vrai sélecteur de fichier.
- **Résultat attendu** : le sponsor apparaît dans la grille avec sa miniature.
- **Vérifier** : le sponsor apparaît sur la page d'accueil publique, dans un bandeau défilant "Nos partenaires" (section entièrement masquée s'il n'y a aucun sponsor).
- **Action** : supprimer le sponsor.
- **Résultat attendu** : confirmation demandée, puis disparition immédiate de la liste et de la page d'accueil.

### 6. Vérification des permissions
- **Action** : se déconnecter, se connecter avec le compte adhérent, essayer d'accéder directement à `/admin`.
- **Résultat attendu** : redirection automatique vers l'accueil, aucun accès aux fonctionnalités admin.

### 7. Déconnexion
- **Action** : cliquer "Déconnexion" dans la barre de navigation.
- **Résultat attendu** : retour à l'accueil en tant que visiteur, boutons "Connexion"/"Devenir bénévole" réapparaissent.

---

## Parcours Adhérent

### 1. Création de compte (visiteur anonyme)
- **Action** : aller sur `/inscription`, remplir prénom, nom, email, mot de passe (8 caractères min), confirmer.
- **Résultat attendu** : compte créé, connexion automatique immédiate (pas d'email de confirmation à attendre), redirection vers `/dossier-adhesion`.

### 2. Dossier d'adhésion
- **Action** : remplir les 8 étapes du formulaire (nom et prénom, adresse, téléphone mobile, et la case de déclaration sont obligatoires — le reste est optionnel).
- **Résultat attendu** : à chaque étape, "Suivant" avance si les champs obligatoires sont remplis, sinon un message d'erreur apparaît sous le champ concerné.
- **Action** : soumettre à la dernière étape ("Envoyer mon dossier").
- **Résultat attendu** : page de confirmation "Dossier envoyé", statut du compte reste "En attente de validation" jusqu'à validation par un administrateur.

### 3. Tableau de bord adhérent
- **Action** : aller sur `/tableau-de-bord`.
- **Résultat attendu** : statut d'adhésion affiché (Actif / En attente / Suspendu), section "Prochains événements".
- **Vérifier** : tant que le statut est "En attente", l'inscription aux événements reste bloquée avec un message explicite.

### 4. Parcourir et s'inscrire aux événements
- **Action** : aller sur `/evenements`, basculer entre "À venir" et "Précédents", ouvrir un événement.
- **Résultat attendu (une fois le statut "Actif")** : bouton "S'inscrire" visible et fonctionnel ; le compteur de places se met à jour immédiatement.
- **Action** : cliquer "Annuler mon inscription".
- **Résultat attendu** : désinscription immédiate, compteur de places libéré.

### 5. Mon profil
- **Action** : aller sur `/mon-profil`.
- **Résultat attendu** : toutes les informations soumises dans le dossier d'adhésion sont pré-remplies et modifiables. Bouton "Enregistrer les modifications" fonctionnel.
- **Vérifier** : aucune section de téléversement de certificat n'apparaît (le champ "Diplômes et certificats de secourisme" est un champ texte libre, pas un envoi de fichier).

### 6. Mes participations
- **Action** : depuis le tableau de bord, cliquer "Toutes mes participations".
- **Résultat attendu** : liste complète des inscriptions passées et à venir.

### 7. Déconnexion
- **Action** : cliquer "Déconnexion".
- **Résultat attendu** : retour à l'état visiteur.

---

## Points de vigilance identifiés pendant l'audit

- Sur un rechargement complet de page (F5) d'une route protégée, la barre de navigation peut afficher brièvement l'état "visiteur" (boutons Connexion/Inscription) avant de se corriger d'elle-même en une fraction de seconde une fois la session restaurée. C'est un effet visuel mineur, sans impact sur la sécurité (le contenu protégé lui-même ne s'affiche jamais avant vérification).
- Un compte Administrateur sans dossier d'adhésion rempli est systématiquement redirigé vers `/dossier-adhesion` après connexion, comme n'importe quel adhérent. Ce n'est pas bloquant (on peut naviguer manuellement vers `/admin` ensuite) mais c'est une friction évitable pour un compte qui n'a pas vocation à remplir ce formulaire — voir le rapport QA pour la recommandation.
