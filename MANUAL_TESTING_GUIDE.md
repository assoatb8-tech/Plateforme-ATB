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
- **Résultat attendu** : liste des adhérents avec photo de profil (ou icône générique si absente), nom, email, statut, date d'inscription. Recherche et filtre par statut fonctionnels.
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
- **Remplir** : titre FR/AR, description FR/AR, lieu, date de début, date de fin, nombre de places, lien Facebook (optionnel), bannière (optionnelle, sélecteur de fichier image).
- **Résultat attendu** : après soumission, redirection vers la liste avec le nouvel événement affiché, statut "Actif".
- **Vérifier** : l'événement apparaît immédiatement sur `/evenements` (page publique) dans l'onglet "À venir", avec sa bannière affichée en haut de la carte et de sa page détail si une a été ajoutée.
- **Action** : modifier l'événement, changer une date pour le passé (sans toucher au statut).
- **Résultat attendu** : l'événement bascule automatiquement dans l'onglet "Précédents" côté public, son badge de statut affiche désormais "Terminé" (calculé automatiquement à partir de la date de fin, jamais stocké ni nécessitant d'action admin), et les boutons d'inscription disparaissent sur sa page détail.
- **Vérifier** : un événement annulé (statut "Annulé") reste "Annulé" même après sa date de fin — "Terminé" ne s'applique qu'aux événements non annulés dont la date de fin est passée.

### 5a. Événement sur plusieurs jours
- **Action** : sur `/admin/evenements`, "Créer un événement", cocher "Événement sur plusieurs jours".
- **Résultat attendu** : les champs date de début/fin uniques disparaissent, remplacés par un éditeur de jours (au moins un jour par défaut) avec une case "Même horaire chaque jour" cochée par défaut et deux champs d'heure partagés.
- **Action** : renseigner l'heure partagée, cliquer "Ajouter un jour" plusieurs fois, choisir une date pour chaque jour.
- **Résultat attendu** : chaque nouveau jour reprend automatiquement l'heure partagée déjà saisie ; décocher "Même horaire chaque jour" fait apparaître un champ heure de début/fin propre à chaque jour.
- **Vérifier** : impossible de supprimer le dernier jour restant (bouton corbeille désactivé) ; soumettre sans aucun jour affiche une erreur claire.
- **Résultat attendu après soumission** : la carte de l'événement et sa page détail affichent "Événement sur N jours" (avec l'icône calendrier) au lieu d'une plage de dates unique.
- **Action** : modifier un événement multi-jours existant, changer seulement l'heure d'un des jours (sans toucher aux autres).
- **Résultat attendu** : les autres jours et les choix de jours déjà faits par des adhérents inscrits restent intacts (l'édition ne supprime que les jours réellement retirés du formulaire).

### 5b. Choix des jours par un adhérent
- **Action (adhérent)** : ouvrir la page détail d'un événement multi-jours, cocher un ou plusieurs jours proposés, cliquer "S'inscrire".
- **Résultat attendu** : inscription bloquée tant qu'aucun jour n'est coché ; une fois inscrit, les jours choisis restent cochés à la relecture de la page.
- **Action** : décocher un jour puis cliquer "Mettre à jour mes jours".
- **Résultat attendu** : la sélection est enregistrée sans nécessiter une nouvelle inscription complète.
- **Vérifier côté admin/chef** : `/admin/evenements/:id/participants` et `/mes-evenements/:id/presences` affichent une colonne "Jours choisis" (uniquement pour un événement multi-jours) listant les jours sélectionnés par chaque participant.

### 5bis. Participants d'un événement
- **Action** : sur `/admin/evenements`, cliquer le bouton "Participants" (icône personnes) d'un événement qui a au moins une inscription confirmée.
- **Résultat attendu** : page avec le titre de l'événement et un tableau des inscrits (photo, Nom, Téléphone, Email, Statut, Date d'inscription, Présence, Chef de groupe).
- **Vérifier** : la photo de profil de chaque inscrit s'affiche (ou une icône générique si absente) ; un événement sans inscription affiche un état vide clair plutôt qu'un tableau cassé ; le lien "Retour" ramène à `/admin/evenements`.
- **Action** : sur un participant au statut "Inscrit" (confirmé), cliquer "Désigner comme chef".
- **Résultat attendu** : une couronne apparaît à côté de son nom, le bouton devient "Retirer".
- **Vérifier** : aucun bouton de désignation n'apparaît pour un participant en liste d'attente ou annulé (seul un participant confirmé peut être chef) ; désigner un nouveau chef retire automatiquement la couronne du précédent (un seul chef par événement).

### 5ter. Présences (marquées par un admin ou le chef de groupe)
- **Vérifier sur un événement à venir** : la colonne "Présence" affiche "Disponible après l'événement" pour chaque participant confirmé — aucun bouton Présent/Absent tant que l'événement n'est pas terminé.
- **Action** : sur un événement déjà terminé (statut "Terminé"), depuis `/admin/evenements/:id/participants`, cliquer "Présent" puis "Absent" sur un participant confirmé.
- **Résultat attendu** : le bouton cliqué devient coloré (vert pour Présent, rouge pour Absent) ; cliquer à nouveau sur le même bouton l'annule (retour à l'état neutre).
- **Vérifier** : aucun bouton de présence n'apparaît pour un participant en liste d'attente ou annulé.
- **Action (chef de groupe)** : se connecter avec le compte adhérent désigné comme chef d'un événement terminé, aller sur `/tableau-de-bord`.
- **Résultat attendu** : un encart "Événements que vous dirigez" liste l'événement avec un bouton "Gérer les présences", menant à `/mes-evenements/:id/presences` — même tableau que la page admin (sans le contrôle de désignation de chef), avec les mêmes boutons Présent/Absent fonctionnels.
- **Vérifier la protection** : un adhérent qui n'est ni admin ni chef de cet événement, en visitant directement `/mes-evenements/:id/presences` d'un événement qu'il ne dirige pas, obtient un message d'erreur clair (pas de fuite de la liste des participants).
- **Vérifier le tableau de bord admin** : `/admin` affiche une carte "Absences enregistrées" reflétant le nombre total de marques "Absent" dans l'association.

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
- **Action** : sélectionner un membre qui a déjà une photo de profil, remplir la fonction en français (ex. "Président") et en arabe (ex. "رئيس"), remplir le lien Facebook, soumettre.
- **Résultat attendu** : le membre apparaît dans la grille admin avec sa photo de profil (celle de son dossier d'adhésion, pas une photo distincte) et sa fonction, avec un bouton de suppression.
- **Vérifier** : le membre apparaît immédiatement sur la page publique `/bureau` avec sa photo, sa fonction, ses liens téléphone (`tel:`), email (`mailto:`) et Facebook fonctionnels ; le nom et la fonction affichés correspondent à la langue active de l'interface (français ou arabe).
- **Vérifier la recherche de membre** : dans le champ de recherche du formulaire d'ajout, chaque résultat affiche la photo de profil du membre (ou une icône générique si absente).
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

## Notifications (adhérents et administrateurs)
- **Vérifier** : la cloche de notification n'apparaît dans la barre de navigation que pour un utilisateur connecté (absente pour un visiteur).
- **Action (admin)** : créer un nouvel événement depuis `/admin/evenements`.
- **Résultat attendu** : chaque adhérent au statut Actif reçoit une notification "Nouvel événement : …" ; cliquer dessus ouvre la page détail de l'événement et marque la notification comme lue (le point bleu disparaît).
- **Action (visiteur)** : créer un nouveau compte adhérent.
- **Résultat attendu** : chaque administrateur reçoit une notification "… a rejoint l'association" ; cliquer dessus ouvre la fiche du nouvel adhérent sur `/admin/membres/:id`.
- **Vérifier** : le badge sur la cloche affiche le nombre de notifications non lues (jusqu'à "9+") et disparaît une fois toutes les notifications lues ; le bouton "Tout marquer comme lu" vide le badge en un clic sans recharger la page ; sans aucune notification, le panneau affiche un état vide clair.
- **Vérifier le rafraîchissement** : une nouvelle notification apparaît dans le panneau sans action de l'utilisateur dans la minute qui suit (rafraîchissement automatique en arrière-plan).

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

Mise à jour du 2026-08-04 : ajout d'une fonction bilingue (ex. "Président"
/ "رئيس") pour chaque membre du Bureau, affichée sous son nom. La photo
de profil s'affiche désormais dans toutes les listes de personnes
(adhérents, participants à un événement, recherche de membre pour le
Bureau), pas seulement sur les pages Bureau. **Action requise** : les 2
membres du Bureau ajoutés le 2026-08-03 (Khaled Mehdaoui, Firas Berriri)
n'ont pas de fonction — la gestion du Bureau ne permet pas de modifier
une entrée existante, il faut les supprimer puis les rajouter via
`/admin/bureau` pour renseigner leur fonction.

Mise à jour du 2026-08-19 : statut "Terminé" calculé automatiquement pour
les événements dont la date de fin est passée (sans annulation manuelle et
sans tâche planifiée — recalculé à chaque affichage) ; bannière d'image
optionnelle pour les événements, affichée sur les cartes et la page détail ;
désignation d'un "chef de groupe" par événement parmi les participants
confirmés ; nouveau système de notifications intégré (cloche dans la barre
de navigation) — les adhérents actifs sont notifiés à la création d'un
nouvel événement, les administrateurs sont notifiés à chaque nouvelle
inscription. Audit qualité mené sur deux points transverses signalés :
la photo de profil manquait sur la fiche détail d'un adhérent
(`/admin/membres/:id`, corrigé) et un espacement fixe (au lieu d'un
espacement logique) ne s'inversait pas correctement en arabe sur le champ
photo du dossier d'adhésion (corrigé).

Mise à jour du 2026-08-19 (suite) : le chef de groupe désigné pour un
événement (ou un administrateur) peut désormais marquer chaque participant
confirmé "Présent" ou "Absent" une fois l'événement terminé, depuis
`/admin/evenements/:id/participants` (admin) ou `/mes-evenements/:id/presences`
(chef, accessible depuis un nouvel encart "Événements que vous dirigez" sur
le tableau de bord adhérent). Le tableau de bord administrateur affiche une
nouvelle carte "Absences enregistrées" (total des marques "Absent" dans
l'association).

Mise à jour du 2026-08-22 : les événements peuvent désormais s'étendre sur
plusieurs jours (option "Événement sur plusieurs jours" à la création),
chaque jour pouvant avoir son propre horaire ou reprendre un horaire
partagé via une case à cocher dédiée (pour éviter la saisie répétitive).
Un adhérent qui s'inscrit à un événement multi-jours choisit les jours où
il participera, et peut modifier ce choix après coup depuis la page
détail de l'événement ("Mettre à jour mes jours"). Les pages participants
(admin) et présences (chef de groupe) affichent une colonne "Jours
choisis" pour ces événements. Les événements existants sur un seul jour
ne sont pas affectés.

Aucun problème connu à ce jour.
