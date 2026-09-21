-- ==============================================================================
-- MIGRACIÓN: Permitir lectura pública de invitados (miembros virtuales)
-- ==============================================================================

-- Esta política permite que cualquier usuario (incluso los que aún no han 
-- entrado al grupo) puedan ver los perfiles "virtuales" de la sala para poder 
-- seleccionarlos y reclamarlos en la pantalla de "Unirse".
CREATE POLICY "Leer invitados virtuales publicamente" 
ON public.sala_members 
FOR SELECT 
USING (is_virtual = true);
