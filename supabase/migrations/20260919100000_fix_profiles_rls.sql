-- Añadir políticas de RLS para permitir a los usuarios crear y actualizar su propio perfil
CREATE POLICY "Permitir insercion de perfil propio" ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Permitir actualizacion de perfil propio" ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = id);
