# Guide de test manuel — ATB

Ce guide accompagne l'audit QA du 2026-07-31, mis à jour le 2026-08-03
après l'ajout de la page Bureau, de la liste des participants par
événement, des chargements en squelette (skeleton loaders), de la photo
de profil obligatoire et des noms bilingues (français/arabe). Les
identifiants des deux comptes permanents sont dans
`PRODUCTION_CREDENTIALS.md` (non versionné, à la racine du projet).

URL de production : https://plateforme-atb.vercel.app

---

## Parcours Administrateur

### 1. Connexion
- **Action** : aller sur `/connexion`, entrer l'email et le mot de passe admin, cliquer "Se connecter".
- **Résultat attendu** : redirection directe vers l'accueil (un compte ADMIN n'est plus jamais forcé de remplir le dossier d'adhésion, même sans profil membre).
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

### 4. Promouvoir un adhérent en administrateur
- **Action** : depuis la page détail d'un adhérent (pas votre propre compte), utiliser le sélecteur "Modifier le rôle" et choisir "Administrateur".
- **Résultat attendu** : le rôle affiché en haut de page passe immédiatement à "Administrateur".
- **Vérifier** : si cet adhérent est connecté ailleurs (autre onglet/appareil), il obtient l'accès admin **immédiatement**, sans avoir besoin de se reconnecter — naviguer vers `/admin` dans cet autre onglet doit fonctionner tout de suite.
- **Action** : repasser ce compte en "Adhérent" via le même sélecteur.
- **Résultat attendu** : le rôle repasse à "Adhérent", et l'accès admin est retiré tout aussi immédiatement dans l'autre onglet (`/admin` redirige vers l'accueil).
- **Vérifier la protection anti-verrouillage** : ouvrir la page détail de **votre propre** compte admin — le sélecteur "Modifier le rôle" doit être grisé (désactivé), avec la mention "Vous ne pouvez pas modifier votre propre rôle." C'est volontaire : un administrateur ne peut jamais se rétrograder lui-même, pour éviter un blocage sans autre admin pour l'aider.
- **Vérifier la protection du compte principal** : `assoatb8@gmail.com` est marqué comme compte protégé — **aucun autre administrateur** ne peut le rétrograder, même si `assoatb8@gmail.com` peut librement rétrograder n'importe quel autre admin. En vous connectant avec un *autre* compte admin, ouvrir la fiche de `assoatb8@gmail.com` : le sélecteur "Modifier le rôle" doit être grisé avec la mention "Ce compte est protégé et ne peut pas être rétrogradé."

### 5. Gestion des événements
- **Action** : aller sur `/admin/evenements`, cliquer "Créer un événement".
- **Remplir** : titre FR/AR, description FR/AR, lieu, date de début, date de fin, nombre de places, lien Facebook (optionnel).
- **Résultat attendu** : après soumission, redirection vers la liste avec le nouvel événement affiché, statut "Actif".
- **Vérifier** : l'événement apparaît immédiatement sur `/evenements` (page publique) dans l'onglet "À venir".
- **Action** : modifier l'événement, changer une date pour le passé.
- **Résultat attendu** : l'événement bascule automatiquement dans l'onglet "Précédents" côté public, et les boutons d'inscription disparaissent sur sa page détail.

### 5bis. Participants d'un événement
- **Action** : sur `/admin/evenements`, cliquer le bouton "Participants" (icône personnes) d'un événement qui a au moins une inscription.
- **Résultat attendu** : page avec le titre de l'événement et un tableau des inscrits (Nom, Téléphone, Email, Statut, Date d'inscription).
- **Vérifier** : un événement sans inscription affiche un état vide clair plutôt qu'un tableau cassé ; le lien "Retour" ramène à `/admin/evenements`.

### 6. Gestion des sponsors
- **Action** : aller sur `/admin/sponsors`, cliquer "Ajouter un sponsor".
- **Remplir** : nom + sélectionner un fichier image (PNG/JPEG/WEBP/SVG, max 2 Mo) — pas de champ URL, uniquement un vrai sélecteur de fichier.
- **Résultat attendu** : le sponsor apparaît dans la grille avec sa miniature.
- **Vérifier** : le sponsor apparaît sur la page d'accueil publique, dans un bandeau défilant "Nos partenaires" (section entièrement masquée s'il n'y a aucun sponsor).
- **Action** : supprimer le sponsor.
- **Résultat attendu** : confirmation demandée, puis disparition immédiate de la liste et de la page d'accueil.

### 6bis. Gestion du Bureau (الهيئة المديرة)
- **Action** : aller sur `/admin/bureau`, cliquer "Ajouter un membre".
- **Résultat attendu** : un champ de recherche (au lieu de champs texte libres) permet de chercher un adhérent existant par nom ou email ; cliquer sur un résultat le sélectionne.
- **Vérifier** : impossible de soumettre sans avoir sélectionné un membre (message d'erreur affiché).
- **Action** : sélectionner un membre qui n'a pas encore de photo de profil, puis remplir le lien Facebook et soumettre.
- **Résultat attendu** : erreur claire ("ce membre n'a pas encore de photo de profil"), car chaque membre du Bureau doit avoir une photo de profil.
- **Action** : sélectionner un membre qui a déjà une photo de profil, remplir le lien Facebook, soumettre.
- **Résultat attendu** : le membre apparaît dans la grille admin avec sa photo de profil (celle de son dossier d'adhésion, pas une photo distincte), avec un bouton de suppression.
- **Vérifier** : le membre apparaît immédiatement sur la page publique `/bureau` avec sa photo, ses liens téléphone (`tel:`), email (`mailto:`) et Facebook fonctionnels ; le nom affiché correspond à la langue active de l'interface (français ou arabe).
- **Action** : supprimer le membre depuis `/admin/bureau`.
- **Résultat attendu** : confirmation demandée, puis disparition immédiate de la grille admin et de `/bureau` (le compte du membre lui-même n'est pas affecté).
- **Vérifier l'état vide** : sans aucun membre, `/bureau` affiche un message clair plutôt qu'une page cassée.

### 6ter. Photo de profil obligatoire pour tous les membres
- **Action** : se connecter avec un compte adhérent dont le profil n'a pas encore de photo, aller sur `/tableau-de-bord`.
- **Résultat attendu** : un encart orange invite à ajouter une photo de profil, avec un lien vers `/mon-profil`.
- **Action** : depuis `/mon-profil`, essayer d'enregistrer une modification sans avoir ajouté de photo.
- **Résultat attendu** : impossible d'enregistrer tant qu'aucune photo n'est sélectionnée.
- **Vérifier le lien du footer** : sur n'importe quelle page publique, le lien "Nous contacter" du pied de page redirige vers `/bureau`.

### 7. Vérification des permissions
- **Action** : se déconnecter, se connecter avec le compte adhérent, essayer d'accéder directement à `/admin`.
- **Résultat attendu** : redirection automatique vers l'accueil, aucun accès aux fonctionnalités admin.

### 8. Déconnexion
- **Action** : cliquer "Déconnexion" dans la barre de navigation.
- **Résultat attendu** : retour à l'accueil en tant que visiteur, boutons "Connexion"/"Devenir bénévole" réapparaissent.

---

## Parcours Adhérent

### 1. Création de compte (visiteur anonyme)
- **Action** : aller sur `/inscription`, remplir prénom, nom, email, mot de passe (8 caractères min), confirmer.
- **Résultat attendu** : compte créé, connexion automatique immédiate (pas d'email de confirmation à attendre), redirection vers `/dossier-adhesion`.

### 2. Dossier d'adhésion
- **Action** : à l'étape 1, essayer d'avancer sans choisir de photo de profil.
- **Résultat attendu** : message d'erreur "La photo de profil est obligatoire.", impossible de passer à l'étape suivante.
- **Action** : choisir une photo (JPG ou PNG), puis remplir les 8 étapes du formulaire — photo, prénom et nom **en français**, prénom et nom **en arabe**, adresse, téléphone mobile, et la case de déclaration sont obligatoires ; le reste est optionnel.
- **Résultat attendu** : à chaque étape, "Suivant" avance si les champs obligatoires sont remplis, sinon un message d'erreur apparaît sous le champ concerné. Un aperçu circulaire de la photo s'affiche après le téléversement.
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
- **Résultat attendu** : toutes les informations soumises dans le dossier d'adhésion sont pré-remplies et modifiables, y compris la photo (aperçu affiché) et les 4 champs de nom (FR/AR). Bouton "Enregistrer les modifications" fonctionnel.
- **Vérifier** : aucune section de téléversement de certificat n'apparaît (le champ "Diplômes et certificats de secourisme" est un champ texte libre, pas un envoi de fichier).
- **Vérifier les chargements** : au premier affichage de `/mon-profil`, `/evenements`, `/admin/membres`, etc., un placeholder gris animé (skeleton) apparaît brièvement à la place du contenu, plutôt que les trois points animés — ces derniers n'apparaissent plus que lors d'un changement de route ou d'un clic sur un bouton d'action (ex. "Enregistrer").

### 6. Mes participations
- **Action** : depuis le tableau de bord, cliquer "Toutes mes participations".
- **Résultat attendu** : liste complète des inscriptions passées et à venir.

### 7. Déconnexion
- **Action** : cliquer "Déconnexion".
- **Résultat attendu** : retour à l'état visiteur.

---

## Historique des corrections

Les deux points relevés lors de l'audit initial ont été corrigés le même
jour et sont couverts par des tests automatisés (`npm test`) :

- Le flash bref de la barre de navigation en état "visiteur" lors d'un
  rechargement d'une route protégée — corrigé (la barre attend que la
  session soit restaurée avant d'afficher les boutons de connexion/déconnexion).
- La redirection systématique d'un compte Administrateur vers le dossier
  d'adhésion — corrigé (un compte ADMIN n'est plus jamais redirigé vers
  ce formulaire).

Mise à jour du 2026-08-03 : nouvelle page publique Bureau (gestion admin
via `/admin/bureau`), liste des participants par événement pour les
admins, nouvelle animation de chargement ("shadows"), renommage du
projet en "Association Tunisienne Bénévolat", et lien "Nous contacter"
du footer redirigé vers `/bureau`.

Mise à jour du 2026-08-03 (suite) : chargements en squelette (skeleton
loaders) pour les listes/tableaux, photo de profil obligatoire pour le
dossier d'adhésion (stockée de façon privée, visible par l'adhérent et
les admins uniquement), nom et prénom désormais saisis séparément en
français ET en arabe. Les 5 profils membres existants ont été répartis
automatiquement entre les champs FR/AR selon l'écriture détectée — les
administrateurs sont invités à vérifier/compléter la langue manquante
sur `/admin/membres/:id` au besoin.

Mise à jour du 2026-08-03 (suite 2) : la gestion du Bureau ne prend plus
de nom/téléphone/email/photo saisis à la main — l'admin sélectionne un
adhérent existant, et sa photo de profil réelle est affichée sur
`/bureau` (exception délibérée à la règle de confidentialité pour les
membres explicitement publiés par un admin). Ajouter un membre au Bureau
est bloqué tant que ce membre n'a pas lui-même de photo de profil. Un
encart sur le tableau de bord invite les adhérents dont le profil n'a
pas encore de photo à en ajouter une.

Aucun problème connu à ce jour.
