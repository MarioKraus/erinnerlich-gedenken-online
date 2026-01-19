-- Clean up remaining source suffixes that were missed

-- FNP, OF variants, GESAMT, saarbruecker, trierischer
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+(FNP|OFOP|OFHA|BOWO|OF|GESAMT|saarbruecker|Saarbrücker|trierischer|Trierischer|merkurtz).*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+(FNP|OFOP|OFHA|BOWO|OF|GESAMT|saarbruecker|Saarbrücker|trierischer|Trierischer|merkurtz)';

-- Güstrow und Bützow is actually a place name, likely a source attribution
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Güstrow\s+und\s+Bützow$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Güstrow\s+und\s+Bützow$';