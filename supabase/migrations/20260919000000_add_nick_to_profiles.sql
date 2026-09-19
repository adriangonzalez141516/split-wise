-- Add nick column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nick TEXT;

-- Update sala_members to support alias if not already there (the UI seems to want one, but we can also just update name)
-- Actually, the user asked to change the name in the room: "si se registra con otro nick distinto que se cambie en la sala/evento".
-- We will just update the `name` column in `sala_members` to the new registered name. So no schema change for sala_members is strictly required.
