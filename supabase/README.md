# Scripts SQL Supabase

Ces scripts complètent le schéma Prisma avec ce que Prisma ne peut pas exprimer :
triggers Postgres et policies RLS.

## Ordre d'exécution (une fois le projet Supabase créé)

1. `npx prisma migrate deploy` — crée les tables à partir de `prisma/schema.prisma`.
2. `supabase/sql/001_handle_new_user.sql` — trigger qui crée automatiquement la
   ligne `public.users` (role `USER`, status `PENDING`) à chaque inscription
   Supabase Auth. Le rôle n'est jamais dérivé d'une valeur envoyée par le client.
3. `supabase/sql/002_rls_policies.sql` — active RLS et définit les policies
   (utilisateur : accès à ses propres données ; administrateur : accès complet).

À exécuter via le SQL Editor du dashboard Supabase, ou `supabase db push` si le
CLI Supabase est utilisé.

## Pourquoi pas de policy INSERT sur `users` ?

La ligne `public.users` est créée uniquement par le trigger `on_auth_user_created`
(SECURITY DEFINER), jamais depuis le client. Cela empêche un utilisateur de
s'auto-attribuer le rôle `ADMIN` à l'inscription.
