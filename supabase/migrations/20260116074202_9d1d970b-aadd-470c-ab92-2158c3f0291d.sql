-- Clean up source-related suffixes from obituary names
-- Only remove patterns that are clearly source attributions, not real names like "von Bergen", "von Richthofen"

UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+(Rhein-Zeitung|Rhein-Hunsrück-Zeitung|Rhein-Lahn-Zeitung|Nahe-Zeitung|saarbruecker|Saarbrücker|FNP|GESAMT|OF|OFOP|BOWO|OFHA|Mindelheimer|Mainpost|Main-Post|trierischer|Trierischer|merkurtz).*$',
  '',
  'i'
)
WHERE name ~ '\s+von\s+(Rhein-Zeitung|Rhein-Hunsrück-Zeitung|Rhein-Lahn-Zeitung|Nahe-Zeitung|saarbruecker|Saarbrücker|FNP|GESAMT|OF|OFOP|BOWO|OFHA|Mindelheimer|Mainpost|Main-Post|trierischer|Trierischer|merkurtz)';