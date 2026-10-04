BEGIN;

CREATE TABLE public.listas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.list_members (
  list_id UUID REFERENCES public.listas(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public."user"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor')),
  PRIMARY KEY (list_id, user_id) 
);

-- Tabla desprovista de responsabilidad financiera
CREATE TABLE public.lista_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.listas(id) ON DELETE CASCADE,
  id_producto TEXT NOT NULL REFERENCES public.productos(id_producto) ON DELETE RESTRICT,
  cantidad INTEGER DEFAULT 1,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lista_items_list_id ON public.lista_items(list_id);
CREATE INDEX idx_lista_items_id_producto ON public.lista_items(id_producto);

COMMIT;