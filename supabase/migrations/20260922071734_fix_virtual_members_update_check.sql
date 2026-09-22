-- ==============================================================================
-- MIGRACIÓN: Fix reclamar perfil virtual (WITH CHECK clause)
-- ==============================================================================

-- La política anterior fallaba porque Postgres asume que WITH CHECK es igual a USING si no se especifica.
-- Al reclamar la cuenta, cambiamos is_virtual a false, lo que fallaba el chequeo por defecto (is_virtual = true).
-- Ahora permitimos explícitamente que se guarden cambios que hagan que is_virtual pase a false.

DROP POLICY IF EXISTS "Reclamar perfil virtual" ON public.sala_members;

CREATE POLICY "Reclamar perfil virtual" 
ON public.sala_members 
FOR UPDATE 
USING (is_virtual = true)
WITH CHECK (true);
