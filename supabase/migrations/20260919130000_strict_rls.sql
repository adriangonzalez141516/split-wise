-- ==============================================================================
-- MIGRACIÓN: Políticas Estrictas de RLS (Row Level Security)
-- ==============================================================================

-- 1. Función auxiliar (Security Definer) para evitar recursividad infinita
CREATE OR REPLACE FUNCTION public.is_member_of(_sala_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sala_members 
    WHERE sala_id = _sala_id 
    AND (user_id = auth.uid() OR registered_user_id = auth.uid())
  );
$$;

-- 2. Eliminar las políticas permisivas anteriores (de initial_schema.sql)
DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir lectura publica de salas" ON public.salas;
DROP POLICY IF EXISTS "Permitir escritura de salas" ON public.salas;
DROP POLICY IF EXISTS "Permitir lectura publica de miembros" ON public.sala_members;
DROP POLICY IF EXISTS "Permitir escritura de miembros" ON public.sala_members;
DROP POLICY IF EXISTS "Permitir lectura de eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir escritura de eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir lectura de items" ON public.ticket_items;
DROP POLICY IF EXISTS "Permitir escritura de items" ON public.ticket_items;
DROP POLICY IF EXISTS "Permitir lectura de asignaciones" ON public.ticket_item_assignments;
DROP POLICY IF EXISTS "Permitir escritura de asignaciones" ON public.ticket_item_assignments;
DROP POLICY IF EXISTS "Permitir lectura de liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "Permitir escritura de liquidaciones" ON public.liquidaciones;

-- 3. PROFILES: Públicos para leer (por el avatar/nombre), privados para editar
CREATE POLICY "Leer perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Editar propio perfil" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 4. SALAS
CREATE POLICY "Leer salas propias" ON public.salas FOR SELECT USING (public.is_member_of(id));
CREATE POLICY "Crear salas" ON public.salas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Editar salas propias" ON public.salas FOR UPDATE USING (public.is_member_of(id));
CREATE POLICY "Borrar salas propias" ON public.salas FOR DELETE USING (public.is_member_of(id));

-- 5. SALA MEMBERS
CREATE POLICY "Leer miembros de mi sala" ON public.sala_members FOR SELECT USING (public.is_member_of(sala_id));
CREATE POLICY "Insertarse a uno mismo o invitar" ON public.sala_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Editar miembros de mi sala" ON public.sala_members FOR UPDATE USING (public.is_member_of(sala_id));
CREATE POLICY "Borrar miembros de mi sala" ON public.sala_members FOR DELETE USING (public.is_member_of(sala_id));

-- 6. EVENTOS
CREATE POLICY "Leer eventos de mi sala" ON public.eventos FOR SELECT USING (public.is_member_of(sala_id));
CREATE POLICY "Crear eventos en mi sala" ON public.eventos FOR INSERT WITH CHECK (public.is_member_of(sala_id));
CREATE POLICY "Editar eventos en mi sala" ON public.eventos FOR UPDATE USING (public.is_member_of(sala_id));
CREATE POLICY "Borrar eventos en mi sala" ON public.eventos FOR DELETE USING (public.is_member_of(sala_id));

-- 7. TICKET ITEMS
CREATE POLICY "Leer items de mi sala" ON public.ticket_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.eventos WHERE id = evento_id AND public.is_member_of(sala_id))
);
CREATE POLICY "Crear items en mi sala" ON public.ticket_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.eventos WHERE id = evento_id AND public.is_member_of(sala_id))
);
CREATE POLICY "Editar items en mi sala" ON public.ticket_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.eventos WHERE id = evento_id AND public.is_member_of(sala_id))
);
CREATE POLICY "Borrar items en mi sala" ON public.ticket_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.eventos WHERE id = evento_id AND public.is_member_of(sala_id))
);

-- 8. TICKET ITEM ASSIGNMENTS
CREATE POLICY "Leer asignaciones de mi sala" ON public.ticket_item_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ticket_items t JOIN public.eventos e ON t.evento_id = e.id WHERE t.id = item_id AND public.is_member_of(e.sala_id))
);
CREATE POLICY "Crear asignaciones en mi sala" ON public.ticket_item_assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ticket_items t JOIN public.eventos e ON t.evento_id = e.id WHERE t.id = item_id AND public.is_member_of(e.sala_id))
);
CREATE POLICY "Editar asignaciones en mi sala" ON public.ticket_item_assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.ticket_items t JOIN public.eventos e ON t.evento_id = e.id WHERE t.id = item_id AND public.is_member_of(e.sala_id))
);
CREATE POLICY "Borrar asignaciones en mi sala" ON public.ticket_item_assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.ticket_items t JOIN public.eventos e ON t.evento_id = e.id WHERE t.id = item_id AND public.is_member_of(e.sala_id))
);

-- 9. LIQUIDACIONES
CREATE POLICY "Leer liquidaciones de mi sala" ON public.liquidaciones FOR SELECT USING (public.is_member_of(sala_id));
CREATE POLICY "Crear liquidaciones en mi sala" ON public.liquidaciones FOR INSERT WITH CHECK (public.is_member_of(sala_id));
CREATE POLICY "Editar liquidaciones en mi sala" ON public.liquidaciones FOR UPDATE USING (public.is_member_of(sala_id));
CREATE POLICY "Borrar liquidaciones en mi sala" ON public.liquidaciones FOR DELETE USING (public.is_member_of(sala_id));
