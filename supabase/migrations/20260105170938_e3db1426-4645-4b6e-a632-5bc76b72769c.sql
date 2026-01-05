-- Function to find duplicate obituaries (same name, birth_date, death_date)
-- Returns IDs of duplicates to delete (keeps the oldest entry)
CREATE OR REPLACE FUNCTION public.find_duplicate_obituaries()
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id
  FROM obituaries o
  INNER JOIN (
    SELECT name, birth_date, death_date, MIN(created_at) as first_created
    FROM obituaries
    GROUP BY name, birth_date, death_date
    HAVING COUNT(*) > 1
  ) dups ON o.name = dups.name 
    AND (o.birth_date = dups.birth_date OR (o.birth_date IS NULL AND dups.birth_date IS NULL))
    AND o.death_date = dups.death_date
    AND o.created_at > dups.first_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;