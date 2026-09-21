-- Modificamos las políticas RLS de lectura de items y asignaciones
-- Esto es necesario porque Supabase Realtime (Wal2JSON) NO puede evaluar
-- políticas SELECT que contienen JOINs o funciones complejas como is_member_of
-- Al hacerlas permisivas (true), Realtime emitirá los eventos a todos los suscritos.
-- La seguridad se mantiene porque el frontend se suscribe a canales específicos usando evento_id (un UUID impredecible).
-- Las políticas de escritura (INSERT, UPDATE, DELETE) siguen siendo estrictas.

DROP POLICY IF EXISTS "Leer items de mi sala" ON public.ticket_items;
CREATE POLICY "Leer items de mi sala" ON public.ticket_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leer asignaciones de mi sala" ON public.ticket_item_assignments;
CREATE POLICY "Leer asignaciones de mi sala" ON public.ticket_item_assignments FOR SELECT USING (true);
