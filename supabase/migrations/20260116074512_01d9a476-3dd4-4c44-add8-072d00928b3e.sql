-- Update duplicate detection to use only name and birth_date (not death_date)
CREATE OR REPLACE FUNCTION public.find_duplicate_obituaries()
 RETURNS TABLE(id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT o.id
  FROM obituaries o
  INNER JOIN (
    SELECT name, birth_date, MIN(created_at) as first_created
    FROM obituaries
    GROUP BY name, birth_date
    HAVING COUNT(*) > 1
  ) dups ON o.name = dups.name 
    AND (o.birth_date = dups.birth_date OR (o.birth_date IS NULL AND dups.birth_date IS NULL))
    AND o.created_at > dups.first_created;
END;
$function$;