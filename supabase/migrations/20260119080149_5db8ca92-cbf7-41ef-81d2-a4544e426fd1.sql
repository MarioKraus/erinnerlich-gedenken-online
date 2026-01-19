-- Clean up source-related suffixes from obituary names
-- This removes city names from Freie Presse Sachsen and additional newspaper names

-- Freie Presse Sachsen regional editions (cities as source identifiers)
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+(Aue|Marienberg|Zwickau|Freiberg|Glauchau|Hohenstein-Ernstthal|Mittweida|Plauen|Schwarzenberg|Stollberg|Werdau|Zschopau|Chemnitz|Annaberg|Auerbach|Oelsnitz|Reichenbach|Crimmitschau|Limbach-Oberfrohna|Frankenberg|Flöha|Döbeln|Brand-Erbisdorf|Olbernhau|Burgstädt)$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+(Aue|Marienberg|Zwickau|Freiberg|Glauchau|Hohenstein-Ernstthal|Mittweida|Plauen|Schwarzenberg|Stollberg|Werdau|Zschopau|Chemnitz|Annaberg|Auerbach|Oelsnitz|Reichenbach|Crimmitschau|Limbach-Oberfrohna|Frankenberg|Flöha|Döbeln|Brand-Erbisdorf|Olbernhau|Burgstädt)$';

-- Additional specific newspaper names not yet covered
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+(Aichacher Nachrichten|Allgemeine Zeitung Alzey|Allgemeine Zeitung Mainz|Darmstädter Echo|Der Prignitzer|Die Glocke|Die Harke|Dill Block|Donau Zeitung|Donauwörther Zeitung|Friedberger Allgemeine|Groß-Gerauer Echo|Günzburger Zeitung|Hochheimer Zeitung|Illertisser Zeitung|Lübecker Nachrichten|Mittelschwäbische Nachrichten|Nassauische Neue Presse|Neu-Ulmer Zeitung|Neuburger Rundschau|Norddeutsche Neueste Nachrichten|Ostfriesischer Kurier|Rieser Nachrichten|Schaumburger Nachrichten|Westerwälder Zeitung|Wetzlarer Neue Zeitung|Wiesbadener Kurier).*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+(Aichacher Nachrichten|Allgemeine Zeitung Alzey|Allgemeine Zeitung Mainz|Darmstädter Echo|Der Prignitzer|Die Glocke|Die Harke|Dill Block|Donau Zeitung|Donauwörther Zeitung|Friedberger Allgemeine|Groß-Gerauer Echo|Günzburger Zeitung|Hochheimer Zeitung|Illertisser Zeitung|Lübecker Nachrichten|Mittelschwäbische Nachrichten|Nassauische Neue Presse|Neu-Ulmer Zeitung|Neuburger Rundschau|Norddeutsche Neueste Nachrichten|Ostfriesischer Kurier|Rieser Nachrichten|Schaumburger Nachrichten|Westerwälder Zeitung|Wetzlarer Neue Zeitung|Wiesbadener Kurier)';

-- Nordkurier sub-editions
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Nordkurier\s+.*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Nordkurier\s+';

-- Uckermark Kurier editions
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Uckermark\s+Kurier.*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Uckermark\s+Kurier';

-- Stadtspiegel editions
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Stadtspiegel\s+.*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Stadtspiegel\s+';

-- Trauer Vest
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Trauer\s+Vest.*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Trauer\s+Vest';

-- Offenbach (as source, not part of noble names)
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+Offenbach$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+Offenbach$';

-- Generic pattern: remaining "von [Name] Zeitung/Nachrichten/etc."
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+[A-Za-zäöüÄÖÜß\-]+\s*(Zeitung|Nachrichten|Tageblatt|Anzeiger|Post|Kurier|Abendblatt|Rundschau|Allgemeine|Volkszeitung|Volksfreund|Echo|Presse|Block).*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+[A-Za-zäöüÄÖÜß\-]+\s*(Zeitung|Nachrichten|Tageblatt|Anzeiger|Post|Kurier|Abendblatt|Rundschau|Allgemeine|Volkszeitung|Volksfreund|Echo|Presse|Block)';

-- Cleanup: Previously covered patterns that may have been missed
UPDATE obituaries
SET name = regexp_replace(
  name,
  '\s+von\s+(Sächsische Zeitung|Leipziger Volkszeitung|Frankfurter Allgemeine Zeitung|Stuttgarter Zeitung|Hamburger Abendblatt|Augsburger Allgemeine|Ruhr Nachrichten|Kieler Nachrichten|Peiner Allgemeine Zeitung|Märkischen Allgemeine Zeitung).*$',
  '',
  'i'
)
WHERE name ~* '\s+von\s+(Sächsische Zeitung|Leipziger Volkszeitung|Frankfurter Allgemeine Zeitung|Stuttgarter Zeitung|Hamburger Abendblatt|Augsburger Allgemeine|Ruhr Nachrichten|Kieler Nachrichten|Peiner Allgemeine Zeitung|Märkischen Allgemeine Zeitung)';