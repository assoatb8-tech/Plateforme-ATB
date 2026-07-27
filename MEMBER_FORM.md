# MEMBER_FORM.md

# Formulaire d'adhésion

## Objectif

Chaque personne souhaitant devenir adhérent doit remplir un formulaire complet contenant ses informations personnelles, professionnelles et associatives.

Le formulaire doit être disponible en :

- Français
- العربية


L'utilisateur doit pouvoir le remplir depuis un téléphone.


---

# Section 1 - Informations personnelles

## Nom et prénom


Français :

```
Nom et prénom
```


العربية :

```
الإسم واللقب
```


Type :

Text


Obligatoire :

Oui


---

## Sexe


العربية :

```
الجنس
```


Valeurs :

- Homme
- Femme


---

## Nom du père


العربية :

```
إسم الأب
```


Type :

Text


---

## Nom du grand-père


العربية :

```
إسم الجد
```


Type :

Text


---

## Nom et prénom de la mère


العربية :

```
إسم الأم ولقبها
```


Type :

Text


---

# Section 2 - Naissance et identité


## Date de naissance


العربية :

```
تاريخ الولادة
```


Type :

Date


---

## Lieu de naissance


العربية :

```
مكانها
```


Type :

Text


---

## Numéro de carte d'identité nationale


العربية :

```
رقم بطاقة التعريف الوطنية
```


Type :

Text


Validation :

- longueur correcte
- uniquement caractères autorisés


---

## Lieu de délivrance CIN


العربية :

```
الصادرة
```


Type :

Text


---

## Date de délivrance CIN


العربية :

```
بتاريخ
```


Type :

Date


---

# Section 3 - Coordonnées


## Adresse complète


العربية :

```
العنوان الشخصي بكلّ دقة ووضوح
```


Type :

Textarea


Obligatoire.


---

## Téléphone fixe


العربية :

```
الهاتف القار
```


Type :

Phone


---

## Téléphone mobile


العربية :

```
الهاتف الجوال
```


Type :

Phone


Obligatoire.


---

## Email


العربية :

```
البريد الإلكتروني
```


Type :

Email


---

# Section 4 - Situation familiale


## Situation familiale


العربية :

```
الحالة العائلية
```


Valeurs :

- Célibataire
- Marié(e)
- Divorcé(e)
- Veuf(ve)


---

## Nombre d'enfants


العربية :

```
عدد الأبناء
```


Type :

Number


---

## Groupe sanguin


العربية :

```
صنف الدم
```


Valeurs :

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

# Section 5 - Formation


## Niveau éducatif


العربية :

```
المستوى التعليمي
```


Type :

Text


---

# Section 6 - Profession


## Profession


العربية :

```
المهنة
```


Type :

Text


---

## Spécialité


العربية :

```
الإختصاص
```


Type :

Text


---

## Institution employeur


العربية :

```
المؤسسة المشغلة
```


Type :

Text


---

## Adresse employeur


العربية :

```
عنوانها بكل دقة
```


Type :

Textarea


---

## Téléphone employeur


العربية :

```
رقم هاتفها
```


Type :

Phone


---

## Fax professionnel


العربية :

```
فاكس العمل
```


Type :

Text


---

# Section 7 - Expérience associative


## Associations précédentes


العربية :

```
الجمعيات التي شاركت فيها
```


Type :

Textarea


---

# Section 8 - Activités sportives


## Sports pratiqués


العربية :

```
الرياضة التي مارستها أو تمارسها إلى حد الآن
```


Type :

Textarea


---

# Section 9 - Secourisme


## Diplômes et certificats


العربية :

```
الشهائد المتحصل عليها في ميدان الإسعاف
```


Type :

Textarea


Possibilité :

Ajouter fichiers PDF/images.


---

# Section 10 - Déclaration


Texte :

```
Je certifie que les informations fournies sont exactes.
```


العربية :

```
أشهد بصحة هذه المعطيات
```


Champ obligatoire :

Checkbox


---

# Signature


Informations :

```
Lieu

Date

Signature
```


العربية :

```
حرر ب...............................في.......................................

الإمضاء
```


---

# Validation du formulaire


Avant envoi :

Vérifier :

- champs obligatoires remplis ;
- email valide ;
- CIN valide ;
- téléphone valide ;
- déclaration acceptée.


---

# Expérience utilisateur


Le formulaire doit :

- être sauvegardé automatiquement ;
- permettre de reprendre plus tard ;
- afficher la progression ;
- fonctionner sur mobile ;
- supporter RTL arabe.


---

# Stockage


Les fichiers uploadés doivent être stockés dans :

Supabase Storage


Organisation :

```
members/

   userId/

       cin/

       certificates/

       profile/
```


---

# Confidentialité


Les données personnelles sont sensibles.

Règles :

- seul l'utilisateur voit son dossier ;
- seuls les administrateurs autorisés voient les dossiers complets ;
- aucune donnée personnelle ne doit être exposée publiquement.