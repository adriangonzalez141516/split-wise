-- Habilitar Supabase Realtime para las tablas colaborativas
-- Usaremos la publicación predeterminada "supabase_realtime"

-- Primero aseguramos que la publicación existe (suele existir por defecto)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Añadimos las tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.salas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sala_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_item_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.liquidaciones;
