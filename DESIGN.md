# Design System - Association Tunisienne Bénévolat (ATB)

## Vision

Créer une interface moderne, simple et accessible pour l'**Association Tunisienne Bénévolat (ATB)**, en s'appuyant sur l'identité visuelle de son logo officiel.

L'application doit être utilisable par :

- jeunes bénévoles ;
- responsables administratifs ;
- utilisateurs peu techniques.

Le design doit inspirer :

- confiance ;
- solidarité ;
- professionnalisme ;
- identité nationale tunisienne.

---

# Principes UI

## Mobile First

L'application est conçue d'abord pour smartphone.

Priorités :

1. Mobile
2. Tablette
3. Desktop

---

# Style général

Style :

- moderne ;
- épuré ;
- chaleureux ;
- associatif.

Éviter :

- interfaces complexes ;
- surcharge visuelle ;
- trop de couleurs (s'en tenir à la palette définie).

---

# Palette de couleurs

La palette de couleurs est directement extraite du logo officiel.

## Couleur principale

**Rouge Tunisien (Vif)** :
*Inspiré par le croissant et l'étoile du logo et le drapeau national.*

#E02424


Utilisation :
- boutons principaux de validation (CTA) ;
- actions positives ;
- éléments de marque clés.

---

## Couleur accent

**Orange Protecteur** :
*Inspiré par le blason central du logo.*

#F97316


Utilisation :
- notifications importantes ;
- mise en évidence d'informations clés ;
- états actifs spéciaux.

---

## Couleur secondaire

**Sable Doré** :
*Inspiré par la bordure en corde et les épis de blé du logo.*

#D1AC63


Utilisation :
- navigation secondaire ;
- arrière-plans de section légers ;
- séparateurs élégants.

---

## Couleurs système

Succès :
#16A34A


Erreur :
#DC2626


Attention :
#F59E0B


---

# Background

Principal :
#F8FAFC


Cartes :
#FFFFFF


---

# Typographie

Police principale :
Inter

Pour l'arabe :
**Noto Sans Arabic**

Tailles :

Titre principal :
text-4xl


Titre section :
text-2xl


Texte normal :
text-base


---

# Direction des langues

## Français

Direction :
LTR


Alignement :
gauche

---

## العربية

Direction :
RTL


Alignement :
droite

Tous les composants doivent supporter automatiquement les deux directions.

---

# Composants

## Logo

Le logo complet doit être utilisé de manière visible mais proportionnée.

Utilisation :
- Navbar (mobile et desktop) : taille réduite (ex: `h-12`).
- Page de connexion : taille moyenne (ex: `h-24`) au centre.

---

## Button

Styles :

- **Primary** : Fond `#E02424`, Texte `#FFFFFF`
- **Secondary** : Fond `#D1AC63`, Texte `#FFFFFF`
- **Danger** : Fond `#DC2626`, Texte `#FFFFFF`
- **Ghost** : Fond transparent, Texte `#E02424`

Exemple :
Créer un événement


---

## Card

Utilisation :
- événements ;
- profils ;
- statistiques.

Style :
rounded-xl
shadow-sm
border border-slate-200


---

## Input

Doit contenir :
- label ;
- placeholder ;
- message erreur ;
- état validation.

Style d'état focus/actif : utiliser le Rouge Tunisien (`#E02424`) ou Sable Doré (`#D1AC63`).

---

## Navbar

Mobile :
- logo ATB ;
- changement langue (FR/AR) ;
- profil.

Desktop :
- logo ATB ;
- menu complet ;
- changement langue (FR/AR) ;
- profil utilisateur.

---

## Dashboard Admin

Structure :
Sidebar
Header
Statistics Cards
Tables
Charts


Informations affichées :
- nombre adhérents ;
- événements actifs ;
- inscriptions.

---

# Pages principales

## Public

- Accueil
- Présentation association
- Connexion
- Inscription

---

## Adhérent

- Dashboard
- Mon profil
- Mon dossier adhésion
- Événements
- Mes participations

---

## Administrateur

- Dashboard
- Membres
- Événements
- Sponsors
- Paramètres

---

# Animations

Utiliser uniquement des animations légères.

Exemples :
- apparition des cartes ;
- transitions boutons ;
- loaders.

Éviter :
- animations longues ;
- effets distrayants.

---

# Accessibilité

Obligatoire :
- contraste correct ;
- labels formulaires ;
- navigation clavier ;
- tailles lisibles.

---

# Responsive

Breakpoints Tailwind :
sm
md
lg
xl


Tester :
- Mobile : 375px
- Tablette : 768px
- Desktop : 1440px

---

# Images

Les images doivent :
- être optimisées ;
- avoir un texte alternatif ;
- être stockées dans Supabase Storage.

---

# Expérience utilisateur

Objectif :

Un bénévole doit pouvoir :
1. créer un compte ;
2. remplir son dossier ;
3. trouver une activité ;
4. s'inscrire ;

en moins de quelques minutes.

L'administrateur doit pouvoir :
1. voir les membres ;
2. créer une activité ;
3. gérer les inscriptions ;

sans formation technique.