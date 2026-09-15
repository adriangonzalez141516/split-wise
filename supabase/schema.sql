-- ==============================================================================
-- SPLIT-WISE / STITCH DATABASE SCHEMA (PostgreSQL / Supabase)
-- Proyecto: ilznoggvvbepzoocbywx
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROFILES / USUARIOS REALES
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Auth UUID o ID textual
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: SALAS (Grupos de gasto independientes)
CREATE TABLE IF NOT EXISTS public.salas (
    id TEXT PRIMARY KEY, -- Slug legible (ej: 'cenas-viernes', 'viaje-asturias')
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'groups',
    debt_threshold NUMERIC(10, 2) DEFAULT -50.00,
    bote_comun NUMERIC(10, 2) DEFAULT 0.00,
    pass_type TEXT DEFAULT 'pase_sala',
    pass_status TEXT DEFAULT 'activo',
    pass_events_used INT DEFAULT 0,
    pass_max_events INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: MIEMBROS DE SALA (Soporta usuarios registrados y miembros virtuales/fantasmas)
CREATE TABLE IF NOT EXISTS public.sala_members (
    id TEXT PRIMARY KEY,
    sala_id TEXT NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    claim_token TEXT UNIQUE,
    registered_user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: EVENTOS (Cenas, compras, consumos en sala)
CREATE TABLE IF NOT EXISTS public.eventos (
    id TEXT PRIMARY KEY,
    sala_id TEXT NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    venue TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'en_curso' CHECK (status IN ('en_curso', 'cerrado')),
    original_payer_id TEXT REFERENCES public.sala_members(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: ITEMS DE TICKET / PLATOS
CREATE TABLE IF NOT EXISTS public.ticket_items (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL DEFAULT 'food',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: ASIGNACIÓN DE ITEMS A MIEMBROS (Quién comparte cada plato)
CREATE TABLE IF NOT EXISTS public.ticket_item_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT NOT NULL REFERENCES public.ticket_items(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES public.sala_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_item_member UNIQUE (item_id, member_id)
);

-- 8. TABLA: LIQUIDACIONES Y TRANSACCIONES (Bizums sugeridos y consolidados)
CREATE TABLE IF NOT EXISTS public.liquidaciones (
    id TEXT PRIMARY KEY,
    sala_id TEXT NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
    evento_id TEXT REFERENCES public.eventos(id) ON DELETE SET NULL,
    from_member_id TEXT NOT NULL REFERENCES public.sala_members(id) ON DELETE CASCADE,
    to_member_id TEXT NOT NULL REFERENCES public.sala_members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'propuesta' CHECK (status IN ('propuesta', 'pendiente', 'consolidado')),
    rule_applied TEXT NOT NULL DEFAULT 'regla_4_min_cash_flow',
    note TEXT,
    suggested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_sala_members_sala ON public.sala_members(sala_id);
CREATE INDEX IF NOT EXISTS idx_eventos_sala ON public.eventos(sala_id);
CREATE INDEX IF NOT EXISTS idx_ticket_items_evento ON public.ticket_items(evento_id);
CREATE INDEX IF NOT EXISTS idx_assignments_item ON public.ticket_item_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member ON public.ticket_item_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_sala ON public.liquidaciones(sala_id);

-- 10. SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sala_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo / acceso público controlado
CREATE POLICY "Permitir lectura publica de perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de salas" ON public.salas FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de salas" ON public.salas FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de miembros" ON public.sala_members FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de miembros" ON public.sala_members FOR ALL USING (true);

CREATE POLICY "Permitir lectura de eventos" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de eventos" ON public.eventos FOR ALL USING (true);

CREATE POLICY "Permitir lectura de items" ON public.ticket_items FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de items" ON public.ticket_items FOR ALL USING (true);

CREATE POLICY "Permitir lectura de asignaciones" ON public.ticket_item_assignments FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de asignaciones" ON public.ticket_item_assignments FOR ALL USING (true);

CREATE POLICY "Permitir lectura de liquidaciones" ON public.liquidaciones FOR SELECT USING (true);
CREATE POLICY "Permitir escritura de liquidaciones" ON public.liquidaciones FOR ALL USING (true);

-- 11. DATOS SEMILLA (SEED DATA)
-- Perfil del usuario Carlos
INSERT INTO public.profiles (id, name, email, phone, avatar_url)
VALUES ('user_carlos_1', 'Carlos M.', 'carlos@stitch.app', '+34 600 112 233', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Sala principal: Cenas de los Viernes
INSERT INTO public.salas (id, name, description, icon, debt_threshold, bote_comun, pass_type, pass_status, pass_events_used, pass_max_events)
VALUES ('cenas-viernes', 'Cenas de los Viernes', 'Grupo gastronómico semanal y cañas de fin de semana', 'restaurant', -50.00, 45.00, 'pase_sala', 'activo', 3, 20)
ON CONFLICT (id) DO NOTHING;

-- Miembros de la sala
INSERT INTO public.sala_members (id, sala_id, user_id, name, phone, avatar_url, is_virtual) VALUES
('m1', 'cenas-viernes', 'user_carlos_1', 'Carlos M. (Tú)', '+34 600 112 233', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', false),
('m2', 'cenas-viernes', NULL, 'Mateo R.', '+34 611 223 344', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', false),
('m3', 'cenas-viernes', NULL, 'Sofía L.', '+34 622 334 455', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', false),
('m4', 'cenas-viernes', NULL, 'Elena V. (Invitada)', '+34 633 445 566', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', true),
('m5', 'cenas-viernes', NULL, 'Lucas B.', '+34 644 556 677', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', false)
ON CONFLICT (id) DO NOTHING;

-- Evento en curso: Taberna Los Ilustres
INSERT INTO public.eventos (id, sala_id, title, venue, date, status, original_payer_id, total_amount)
VALUES ('taberna-ilustres', 'cenas-viernes', 'Cena Gourmet Los Ilustres', 'Taberna Los Ilustres', CURRENT_DATE, 'en_curso', 'm2', 184.50)
ON CONFLICT (id) DO NOTHING;

-- Platos del evento
INSERT INTO public.ticket_items (id, evento_id, name, quantity, unit_price, total_price, category) VALUES
('item_1', 'taberna-ilustres', 'Chuletón de Vaca Madurada (1kg)', 1, 68.00, 68.00, 'food'),
('item_2', 'taberna-ilustres', 'Vino Ribera del Duero Reserva', 2, 24.00, 48.00, 'alcohol'),
('item_3', 'taberna-ilustres', 'Croquetas de Jamón Ibérico (8ud)', 2, 12.00, 24.00, 'food'),
('item_4', 'taberna-ilustres', 'Tarta de Queso Idiazábal Fluida', 3, 7.50, 22.50, 'dessert'),
('item_5', 'taberna-ilustres', 'Aguas Minerales & Cafés Solo', 4, 3.00, 12.00, 'standard_drink')
ON CONFLICT (id) DO NOTHING;

-- Asignaciones de platos
INSERT INTO public.ticket_item_assignments (item_id, member_id) VALUES
('item_1', 'm1'), ('item_1', 'm2'), ('item_1', 'm5'),
('item_2', 'm1'), ('item_2', 'm2'),
('item_3', 'm1'), ('item_3', 'm2'), ('item_3', 'm3'), ('item_3', 'm4'), ('item_3', 'm5'),
('item_4', 'm3'), ('item_4', 'm4'), ('item_4', 'm5'),
('item_5', 'm1'), ('item_5', 'm2'), ('item_5', 'm3'), ('item_5', 'm4')
ON CONFLICT DO NOTHING;

-- Transacciones / Liquidaciones
INSERT INTO public.liquidaciones (id, sala_id, evento_id, from_member_id, to_member_id, amount, status, rule_applied, note) VALUES
('tx_1', 'cenas-viernes', 'taberna-ilustres', 'm3', 'm1', 28.50, 'propuesta', 'regla_3', 'Puesta al día con Carlos M.'),
('tx_2', 'cenas-viernes', 'taberna-ilustres', 'm4', 'm2', 19.50, 'propuesta', 'regla_2', 'Liquidación en cascada a Mateo R.')
ON CONFLICT (id) DO NOTHING;
