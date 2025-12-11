-- Create obituaries table
CREATE TABLE public.obituaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  death_date DATE NOT NULL,
  location TEXT,
  photo_url TEXT,
  text TEXT,
  source TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.obituaries ENABLE ROW LEVEL SECURITY;

-- Public read access for all obituaries
CREATE POLICY "Obituaries are viewable by everyone" 
ON public.obituaries 
FOR SELECT 
USING (true);

-- Anyone can insert obituaries (for now, no auth required)
CREATE POLICY "Anyone can create obituaries" 
ON public.obituaries 
FOR INSERT 
WITH CHECK (true);

-- Users can update their own obituaries
CREATE POLICY "Users can update their own obituaries" 
ON public.obituaries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own obituaries
CREATE POLICY "Users can delete their own obituaries" 
ON public.obituaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for search performance
CREATE INDEX idx_obituaries_name ON public.obituaries USING gin(to_tsvector('german', name));
CREATE INDEX idx_obituaries_location ON public.obituaries(location);
CREATE INDEX idx_obituaries_death_date ON public.obituaries(death_date DESC);
CREATE INDEX idx_obituaries_created_at ON public.obituaries(created_at DESC);