-- ==============================================================================
-- MIGRACIÓN: Función RPC para reclamar miembros virtuales de forma segura
-- ==============================================================================

-- Esta función se ejecuta con privilegios de administrador (SECURITY DEFINER)
-- permitiendo saltarse los bloqueos de RLS que pueden dar problemas al reclamar
-- cuentas (ya que el usuario pasa de no ser miembro a ser miembro en la misma acción).

CREATE OR REPLACE FUNCTION public.claim_virtual_member(
  p_member_id TEXT,
  p_sala_id TEXT,
  p_user_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_avatar_url TEXT,
  p_is_virtual BOOLEAN,
  p_registered_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el perfil virtual existe, es virtual, y está libre
  IF NOT EXISTS (
    SELECT 1 FROM public.sala_members 
    WHERE id = p_member_id 
      AND sala_id = p_sala_id 
      AND is_virtual = true 
      AND user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Perfil virtual no disponible o ya reclamado';
  END IF;

  -- Actualizar el perfil (bypasses RLS due to SECURITY DEFINER)
  UPDATE public.sala_members
  SET 
    user_id = p_user_id,
    is_virtual = p_is_virtual,
    name = p_name,
    phone = p_phone,
    avatar_url = p_avatar_url,
    registered_user_id = p_registered_user_id
  WHERE id = p_member_id;
END;
$$;
