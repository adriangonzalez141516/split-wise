-- ==============================================================================
-- MIGRACIÓN: Permitir reclamar miembros virtuales
-- ==============================================================================

-- Esta política permite que cualquier usuario autenticado o invitado anónimo
-- pueda hacer UPDATE a un perfil virtual para reclamarlo (vincular su user_id).
CREATE POLICY "Reclamar perfil virtual" 
ON public.sala_members 
FOR UPDATE 
USING (is_virtual = true);
