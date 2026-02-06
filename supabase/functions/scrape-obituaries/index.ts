import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// German obituary sources sorted alphabetically (for sequential scraping starting with Augsburger Allgemeine)
const OBITUARY_SOURCES = [
  { id: 'augsburg', name: 'Augsburger Allgemeine', url: 'https://trauer.augsburger-allgemeine.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'bestattung-kinelly', name: 'Bestattung Kinelly', url: 'https://kinelly.at/trauerfaelle/' },
  { id: 'die-glocke', name: 'Die Glocke', url: 'https://trauer.die-glocke.de/' },
  { id: 'erzbistum-muenchen', name: 'Erzbistum München', url: 'https://www.erzbistum-muenchen.de/ueber-uns/totentafel' },
  { id: 'faz', name: 'Frankfurter Allgemeine', url: 'https://lebenswege.faz.net/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'rheinmain', name: 'Frankfurter Rundschau', url: 'https://trauer-rheinmain.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'freie-presse', name: 'Freie Presse', url: 'https://gedenken.freiepresse.de/' },
  { id: 'hamburger-trauer', name: 'Hamburger Abendblatt', url: 'https://hamburgertrauer.de/traueranzeigen-suche/letzte-14-tage/region-hamburger-abendblatt' },
  { id: 'heimatfriedhof', name: 'Heimatfriedhof.online', url: 'https://heimatfriedhof.online/' },
  { id: 'wirtrauern', name: 'Kölner Stadt-Anzeiger', url: 'https://www.wirtrauern.de/traueranzeigen-suche/letzte-14-tage/region-köln' },
  { id: 'mannheim', name: 'Mannheimer Morgen', url: 'https://trauer.mannheimer-morgen.de/traueranzeigen-suche/letzte-14-tage' },
  { id: 'nicklaus', name: 'Nicklaus Bestattungen', url: 'https://www.nicklaus-bestattungen.de/de/totentafel/' },
  { id: 'rz', name: 'Rhein-Zeitung', url: 'https://rz-trauer.de/' },
  { id: 'dortmund', name: 'Ruhr Nachrichten', url: 'https://sich-erinnern.de/traueranzeigen-suche/region-ruhr-nachrichten' },
  { id: 'saarbruecker', name: 'Saarbrücker Zeitung', url: 'https://saarbruecker-zeitung.trauer.de/' },
  { id: 'stuttgart', name: 'Stuttgarter Zeitung', url: 'https://www.stuttgart-gedenkt.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'nordkurier', name: 'Nordkurier', url: 'https://trauer.nordkurier.de' },
  { id: 'trauer-anzeigen', name: 'Trauer-Anzeigen.de', url: 'https://trauer-anzeigen.de/' },
  { id: 'trauer-de', name: 'Trauer.de', url: 'https://www.trauer.de/traueranzeigen-suche/region-waz--26--lokalkompass' },
  { id: 'nrw', name: 'Trauer NRW', url: 'https://trauer-in-nrw.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'trauerundgedenken', name: 'Trauer und Gedenken', url: 'https://www.trauerundgedenken.de/traueranzeigen-suche/letzte-14-tage' },
  { id: 'trauerfall', name: 'Trauerfall.de', url: 'https://trauerfall.de/' },
  { id: 'volksfreund', name: 'Trierischer Volksfreund', url: 'https://volksfreund.trauer.de/' },
  { id: 'vrm-trauer', name: 'VRM Trauer', url: 'https://vrm-trauer.de/' },
  { id: 'muenster', name: 'Westfälische Nachrichten', url: 'https://www.trauer.ms/traueranzeigen-suche/aktuelle-ausgabe' },
];

interface ScrapedObituary {
  name: string;
  birth_date: string | null;
  death_date: string | null;
  death_date_confirmed: boolean; // true if we found an actual death date, false if using publication date as fallback
  publication_date: string;
  location: string | null;
  text: string | null;
  source: string;
  photo_url: string | null;
}

// Helper to delay between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeUrl(url: string, apiKey: string, retryCount = 0): Promise<any> {
  console.log(`Scraping: ${url}`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
      location: { country: 'DE', languages: ['de'] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Scrape failed for ${url}:`, errorText);

    // Hard stop: no credits
    if (errorText.toLowerCase().includes('insufficient credits')) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    // Rate limit handling: retry a couple times using the suggested retry window
    const isRateLimited = response.status === 429 || errorText.toLowerCase().includes('rate limit exceeded');
    if (isRateLimited && retryCount < 2) {
      const retryAfterMatch = errorText.match(/retry after\s+(\d+)s/i);
      const retryAfterSeconds = retryAfterMatch ? Number(retryAfterMatch[1]) : 45;
      const waitMs = (retryAfterSeconds + 2) * 1000;
      console.log(`Rate limit hit for ${url}, waiting ${Math.round(waitMs / 1000)}s before retry ${retryCount + 1}/2`);
      await delay(waitMs);
      return scrapeUrl(url, apiKey, retryCount + 1);
    }

    // Bubble up a helpful reason
    if (isRateLimited) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    throw new Error('SCRAPE_FAILED');
  }

  return response.json();
}

function parseObituariesFromMarkdown(markdown: string, source: string): ScrapedObituary[] {
  // Source-specific parsers
  if (source === 'Erzbistum München') {
    return parseErzbistumMuenchen(markdown, source);
  }
  if (source === 'Bestattung Kinelly') {
    return parseBestattungKinelly(markdown, source);
  }
  if (source === 'Nicklaus Bestattungen') {
    return parseNicklausBestattungen(markdown, source);
  }
  
  const obituaries: ScrapedObituary[] = [];
  const today = new Date().toISOString().split('T')[0];
  const seenNames = new Set<string>();
  
  // Build a map of names to photo URLs from the markdown
  const photoUrlMap = new Map<string, string>();
  
  // Extract image URLs: [![Name](imageUrl)](link) or ![Name](imageUrl)
  const imagePatterns = [
    // [![Traueranzeige von Name](imageUrl)](link)
    /\[!\[(?:Traueranzeige von\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\]\(([^)]+)\)\]/gi,
    // ![Name](imageUrl)
    /!\[(?:Traueranzeige von\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\]\(([^)]+)\)/gi,
  ];
  
  // Helper to clean source from image alt names
  const cleanSourceFromImageName = (name: string): string => {
    return name.replace(/\s+von\s+.+$/i, '').trim();
  };
  
  for (const pattern of imagePatterns) {
    let imgMatch;
    pattern.lastIndex = 0;
    while ((imgMatch = pattern.exec(markdown)) !== null) {
      let name = imgMatch[1].trim();
      // Clean source attribution from name before lowercasing
      name = cleanSourceFromImageName(name).toLowerCase();
      const imageUrl = imgMatch[2].trim();
      // Only store valid image URLs (not icons, logos, etc.)
      if (imageUrl && 
          !imageUrl.includes('icon') && 
          !imageUrl.includes('logo') && 
          !imageUrl.includes('kerze') &&
          !imageUrl.includes('button') &&
          (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp') || imageUrl.includes('image') || imageUrl.includes('foto') || imageUrl.includes('bild'))) {
        photoUrlMap.set(name, imageUrl);
      }
    }
  }
  
  console.log(`Found ${photoUrlMap.size} photo URLs in markdown`);
  
  // Blacklist of non-name strings (lowercase)
  const blacklist = new Set([
    'prominente trauerfälle', 'aktuelle traueranzeigen', 'weitere trauerfälle', 
    'neueste kerzen', 'unsere trauerchats', 'trauerhilfe', 'trauervideos',
    'trauerhilfe live-chat', 'anzeige aufgeben', 'kai sender', 'traueranzeigen',
    'fragen & antworten', 'die trauerphasen', 'trauernde geschwister',
    'die sterbehilfe', 'die palliativstation', 'das hospiz', 'meinungen der teilnehmer',
    'expertenchat jeden', 'unsere trauerchats', 'traueranzeige aufgeben'
  ]);

  // Helper to clean source attributions from names
  const cleanSourceFromName = (name: string): string => {
    // Remove common source attribution patterns like "von Süddeutsche Zeitung", "von OFOP", etc.
    const sourcePatterns = [
      // Specific source abbreviations and names (case-insensitive)
      /\s+von\s+(Süddeutsche Zeitung|Tagesspiegel|Rheinische Post|Sächsische Zeitung|OFOP|OFHA|BOWO|OF|GESAMT|Peiner Allgemeine Zeitung|Ostsee-Zeitung|Kieler Nachrichten|Märkische[rn]? Allgemeine[rn]? Zeitung|Aller Zeitung|Eichsfelder Tageblatt|Münchner Merkur|HAZ|WAZ|Hamburger Abendblatt|Frankfurter Allgemeine|Frankfurter Rundschau|Stuttgarter Zeitung|Weser Kurier|Ruhr Nachrichten|Neue Westfälische|Westfälische Nachrichten|Mannheimer Morgen|Augsburger Allgemeine|Nürnberger Nachrichten|General-Anzeiger|Rhein-Zeitung|Rhein-Hunsrück-Zeitung|Rhein-Lahn-Zeitung|Nahe-Zeitung|BNN|Niederrhein Nachrichten|Wuppertaler Rundschau|Leipziger Volkszeitung|Trauer-Anzeigen|Kölner Stadt-Anzeiger|merkurtz|trauer\.de|Mainpost|Main-Post|Trierischer Volksfreund|Trierischer|trierischer|Saarbrücker|saarbruecker|FNP|Mindelheimer|GmbH).*$/i,
      // Freie Presse Sachsen regional editions (cities as source identifiers)
      /\s+von\s+(Aue|Marienberg|Zwickau|Freiberg|Glauchau|Hohenstein-Ernstthal|Mittweida|Plauen|Schwarzenberg|Stollberg|Werdau|Zschopau|Chemnitz|Annaberg|Auerbach|Oelsnitz|Reichenbach|Crimmitschau|Limbach-Oberfrohna|Frankenberg|Flöha|Döbeln|Brand-Erbisdorf|Olbernhau|Burgstädt)$/i,
      // Additional specific newspaper names
      /\s+von\s+(Aichacher Nachrichten|Allgemeine Zeitung Alzey|Allgemeine Zeitung Mainz|Darmstädter Echo|Der Prignitzer|Die Glocke|Die Harke|Dill Block|Donau Zeitung|Donauwörther Zeitung|Friedberger Allgemeine|Groß-Gerauer Echo|Günzburger Zeitung|Hochheimer Zeitung|Illertisser Zeitung|Lübecker Nachrichten|Mittelschwäbische Nachrichten|Nassauische Neue Presse|Neu-Ulmer Zeitung|Neuburger Rundschau|Norddeutsche Neueste Nachrichten|Nordkurier Demminer Zeitung|Nordkurier Grosso|Nordkurier Müritz-Zeitung|Nordkurier Neubrandenburger Zeitung|Nordkurier Vorpommern Kurier|Offenbach|Ostfriesischer Kurier|Rieser Nachrichten|Schaumburger Nachrichten|Stadtspiegel Bottrop|Stadtspiegel Essen|Trauer Vest|Uckermark Kurier Prenzlauer Zeitung|Uckermark Kurier Templiner Zeitung|Westerwälder Zeitung|Wetzlarer Neue Zeitung|Wiesbadener Kurier).*$/i,
      // Generic pattern: "von [Name] Zeitung/Nachrichten/etc."
      /\s+von\s+[A-Za-zäöüÄÖÜß\-]+\s*(Zeitung|Nachrichten|Tageblatt|Anzeiger|Post|Kurier|Abendblatt|Rundschau|Allgemeine|Volkszeitung|Volksfreund|Echo|Presse|Block).*$/i,
      // Nordkurier sub-editions pattern
      /\s+von\s+Nordkurier\s+.*$/i,
      // Uckermark Kurier pattern
      /\s+von\s+Uckermark\s+Kurier.*$/i,
      // Stadtspiegel pattern
      /\s+von\s+Stadtspiegel\s+.*$/i,
      // Company names
      /\s+von\s+[A-Za-zäöüÄÖÜß\-]+\s*GmbH.*$/i,
    ];
    
    let cleanedName = name;
    for (const pattern of sourcePatterns) {
      cleanedName = cleanedName.replace(pattern, '');
    }
    return cleanedName.trim();
  };

  // Helper to validate name
  const isValidName = (name: string): boolean => {
    if (!name || name.length < 4) return false;
    const lower = name.toLowerCase();
    if (blacklist.has(lower)) return false;
    if (seenNames.has(lower)) return false;
    // Must have at least first and last name
    const parts = name.split(/\s+/).filter(p => p.length > 1);
    if (parts.length < 2) return false;
    // Skip if contains suspicious words
    if (/kerze|bild|chat|hilfe|video|anzeige|telefon|forum|ratgeber/i.test(name)) return false;
    return true;
  };

  let match;

  // Pattern 1: "Traueranzeige von [Name] von [source]" - most common format
  // Examples: "Traueranzeige von Magdalena Pabst von merkurtz"
  const traueranzeigenPattern = /Traueranzeige von\s+([A-ZÄÖÜ][a-zäöüß]+(?:[-\s]+[A-ZÄÖÜ]?[a-zäöüß]+)*(?:\s+von\s+[A-ZÄÖÜ][a-zäöüß\-]+)?)/gi;
  while ((match = traueranzeigenPattern.exec(markdown)) !== null) {
    let name = cleanSourceFromName(match[1].trim());
    if (isValidName(name)) {
      // Look for dates in surrounding context
      const matchIndex = match.index;
      const followingText = markdown.substring(matchIndex, matchIndex + 300);
      const deathDate = extractDeathDate(followingText);
      const birthDate = extractBirthDate(followingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate, // null if not found - will use publication_date as fallback for DB
        death_date_confirmed: deathDate !== null,
        publication_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: photoUrlMap.get(name.toLowerCase()) || null
      });
    }
  }

  // Pattern 2: "## [Anzeige Name](url)" - Süddeutsche/NN format
  // Example: ## [Anzeige Jürgen Rakoski](https://...)
  // Also matches: ## [Name](https://trauer.nn.de/...)
  const anzeigeHeaderPattern = /##\s*\[(?:Anzeige\s+)?([A-ZÄÖÜ][^\]]+)\]\([^)]*(?:traueranzeige|trauer\.nn\.de|trauer\.mainpost\.de)[^)]*\)/gi;
  while ((match = anzeigeHeaderPattern.exec(markdown)) !== null) {
    let name = match[1].trim();
    // Clean "Anzeige " prefix if present
    name = name.replace(/^Anzeige\s+/i, '');
    if (isValidName(name)) {
      // Look for dates after this match (increased range for nn.de format)
      const followingText = markdown.substring(match.index, match.index + 400);
      const deathDate = extractDeathDate(followingText);
      const birthDate = extractBirthDate(followingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate,
        death_date_confirmed: deathDate !== null,
        publication_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: photoUrlMap.get(name.toLowerCase()) || null
      });
    }
  }

  // Pattern 3: Name with dates in format "* DD.MM.YYYY - † DD.MM.YYYY"
  // This catches entries with birth and death dates - handles various markdown escapes
  const nameWithDatesPatterns = [
    /([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*\n?\s*\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
    /([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*\n?\s*\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
    // NN.de format with newlines between name and dates
    /\[([A-ZÄÖÜ][^\]]+)\]\([^)]+\)\s*\n+\s*\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
    // Trauer.de format: [**Name**](url) followed by dates on next line
    // Also handles [**Name** **geb. Maidenname**](url) format
    /\[\*\*([A-ZÄÖÜ][^\*\]]+)\*\*(?:\s+\*\*geb\.\s+[^\*]+\*\*)?\]\([^)]+\)\s*\n+\s*\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
    // Trauer.de format without birth date: [**Name**](url) followed by "- † date"
    /\[\*\*([A-ZÄÖÜ][^\*\]]+)\*\*(?:\s+\*\*geb\.\s+[^\*]+\*\*)?\]\([^)]+\)\s*\n+\s*-\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
  ];
  for (const pattern of nameWithDatesPatterns) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(markdown)) !== null) {
      let name = match[1].trim();
      // Clean any "Anzeige " prefix and bold markers
      name = name.replace(/^Anzeige\s+/i, '').replace(/\*\*/g, '').trim();
      if (isValidName(name)) {
        // Check if this is a pattern with birth date (7+ groups) or just death date (4 groups)
        if (match.length >= 8) {
          const [, , birthDay, birthMonth, birthYear, deathDay, deathMonth, deathYear] = match;
          const deathDate = `${deathYear}-${deathMonth.padStart(2, '0')}-${deathDay.padStart(2, '0')}`;
          seenNames.add(name.toLowerCase());
          obituaries.push({
            name,
            birth_date: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
            death_date: deathDate,
            death_date_confirmed: true,
            publication_date: today,
            location: extractLocationFromSource(source),
            text: null,
            source,
            photo_url: photoUrlMap.get(name.toLowerCase()) || null
          });
        } else if (match.length >= 5) {
          // Death date only pattern
          const [, , deathDay, deathMonth, deathYear] = match;
          const deathDate = `${deathYear}-${deathMonth.padStart(2, '0')}-${deathDay.padStart(2, '0')}`;
          seenNames.add(name.toLowerCase());
          obituaries.push({
            name,
            birth_date: null,
            death_date: deathDate,
            death_date_confirmed: true,
            publication_date: today,
            location: extractLocationFromSource(source),
            text: null,
            source,
            photo_url: photoUrlMap.get(name.toLowerCase()) || null
          });
        }
      }
    }
  }

  // Pattern 4: Image links with name - catches format [![Name](image)](link)
  // But only if not a "Kerze" or utility image
  const imgAltPattern = /\[!\[(?:Traueranzeige von\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/gi;
  while ((match = imgAltPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (isValidName(name)) {
      // Look for dates in surrounding context
      const matchIndex = match.index;
      const followingText = markdown.substring(matchIndex, matchIndex + 300);
      const deathDate = extractDeathDate(followingText);
      const birthDate = extractBirthDate(followingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate,
        death_date_confirmed: deathDate !== null,
        publication_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: photoUrlMap.get(name.toLowerCase()) || null
      });
    }
  }

  // Pattern 5: Links to obituary pages like [Name](https://.../traueranzeige/slug)
  // Also handles bold names like [**Name**](url)
  const obituaryLinkPattern = /\[(\*{0,2})([A-ZÄÖÜ][^\]]+?)\1\]\([^)]*\/traueranzeige\/[^)]+\)/gi;
  while ((match = obituaryLinkPattern.exec(markdown)) !== null) {
    let name = match[2].trim();
    // Clean up prefixes like "Anzeige " and any remaining bold markers
    name = name.replace(/^Anzeige\s+/i, '').replace(/\*\*/g, '').trim();
    // Also clean "geb. Name" suffix for married names
    name = name.replace(/\s+geb\.\s+.+$/i, '').trim();
    if (isValidName(name)) {
      // Look for dates in surrounding context
      const matchIndex = match.index;
      const followingText = markdown.substring(matchIndex, matchIndex + 200);
      const deathDate = extractDeathDate(followingText);
      const birthDate = extractBirthDate(followingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate,
        death_date_confirmed: deathDate !== null,
        publication_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: photoUrlMap.get(name.toLowerCase()) || null
      });
    }
  }

  console.log(`Parser found ${obituaries.length} unique obituaries from ${source}`);
  return obituaries;
}

function extractDeathDate(text: string): string | null {
  const deathPatterns = [
    /†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /✝\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /gestorben\s*(?:am\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
    /verstorben\s*(?:am\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
    /-\s*†?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/
  ];
  
  for (const pattern of deathPatterns) {
    const match = text.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return null;
}

function extractBirthDate(text: string): string | null {
  const birthPatterns = [
    /\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /geboren\s*(?:am\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
    /geb\.\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i
  ];
  
  for (const pattern of birthPatterns) {
    const match = text.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return null;
}

function extractLocationFromSource(source: string): string | null {
  const sourceLocationMap: Record<string, string | null> = {
    // Major cities
    'Tagesspiegel': 'Berlin',
    'Hamburger Abendblatt': 'Hamburg',
    'Süddeutsche Zeitung': 'München',
    'Münchner Merkur': 'München',
    'Erzbistum München': 'München',
    'Kölner Stadt-Anzeiger': 'Köln',
    'Frankfurter Allgemeine': 'Frankfurt',
    'Frankfurter Rundschau': 'Frankfurt',
    'Stuttgarter Zeitung': 'Stuttgart',
    'Rheinische Post': 'Düsseldorf',
    'Ruhr Nachrichten': 'Dortmund',
    'WAZ': 'Essen',
    'Weser Kurier': 'Bremen',
    'Nürnberger Nachrichten': 'Nürnberg',
    'Niederrhein Nachrichten': 'Duisburg',
    'Trauer NRW': 'Bochum',
    'Wuppertaler Rundschau': 'Wuppertal',
    'Neue Westfälische': 'Bielefeld',
    'General-Anzeiger Bonn': 'Bonn',
    'Westfälische Nachrichten': 'Münster',
    'Mannheimer Morgen': 'Mannheim',
    'BNN Karlsruhe': 'Karlsruhe',
    'Augsburger Allgemeine': 'Augsburg',
    // Regional
    'Rhein-Zeitung': 'Koblenz',
    'Heidenheimer Zeitung': 'Heidenheim',
    'Mainpost': 'Würzburg',
    // New sources
    'VRM Trauer': 'Mainz',
    'Die Glocke': 'Oelde',
    'Saarbrücker Zeitung': 'Saarbrücken',
    'HNA': 'Kassel',
    'Freie Presse': 'Chemnitz',
    'Westfalen Nachrichten': 'Münster',
    'Trierischer Volksfreund': 'Trier',
    'Hersfelder Zeitung': 'Bad Hersfeld',
    'Kreiszeitung': 'Syke',
    'WLZ': 'Korbach',
    'Fränkische Nachrichten': 'Tauberbischofsheim',
    'SVZ': 'Schwerin',
    'Trauerfall.de': null,
    'Trauer-Anzeigen.de': null,
    // Austrian sources
    'Bestattung Kinelly': 'Pinkafeld',
    // German funeral homes
    'Nicklaus Bestattungen': 'Würzburg'
  };
  return sourceLocationMap[source] ?? null;
}

// Parser for Erzbistum München format: "21.01. **Christian Losbichler**, Diakon mit Zivilberuf"
function parseErzbistumMuenchen(markdown: string, source: string): ScrapedObituary[] {
  const obituaries: ScrapedObituary[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const todayStr = today.toISOString().split('T')[0];
  const seenNames = new Set<string>();
  
  // Pattern: DD.MM. **Name**, Role/Title
  // Examples: "21.01. **Christian Losbichler**, Diakon mit Zivilberuf"
  const pattern = /(\d{1,2})\.(\d{1,2})\.\s*\*\*([^*]+)\*\*(?:,\s*([^\\n]+))?/gi;
  
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const [, day, month, name, role] = match;
    const cleanName = name.trim();
    
    // Validate name (at least first + last name)
    const nameParts = cleanName.split(/\s+/).filter(p => p.length > 1);
    if (nameParts.length < 2) continue;
    
    const lowerName = cleanName.toLowerCase();
    if (seenNames.has(lowerName)) continue;
    seenNames.add(lowerName);
    
    // Construct death date (assume current year)
    const deathDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    obituaries.push({
      name: cleanName,
      birth_date: null,
      death_date: deathDate,
      death_date_confirmed: true,
      publication_date: todayStr,
      location: 'München',
      text: role?.trim() || null, // Store role/title as text
      source,
      photo_url: null
    });
  }
  
  console.log(`Erzbistum München parser found ${obituaries.length} obituaries`);
  return obituaries;
}

// Parser for Bestattung Kinelly format:
// ##### Name(age)
// \\* DD.MM.YYYY
// † DD.MM.YYYY
// Location
// ![](imageUrl)
function parseBestattungKinelly(markdown: string, source: string): ScrapedObituary[] {
  const obituaries: ScrapedObituary[] = [];
  const today = new Date().toISOString().split('T')[0];
  const seenNames = new Set<string>();
  
  // Split by entries (each starts with #####)
  const entries = markdown.split(/#{5}\s+/).filter(e => e.trim());
  
  for (const entry of entries) {
    // Extract name and optional age: "Hedwig Hatraka(93)"
    const nameMatch = entry.match(/^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*(?:\((\d+)\))?/i);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    const lowerName = name.toLowerCase();
    
    if (seenNames.has(lowerName)) continue;
    seenNames.add(lowerName);
    
    // Extract birth date: \\* DD.MM.YYYY
    const birthMatch = entry.match(/\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    const birthDate = birthMatch 
      ? `${birthMatch[3]}-${birthMatch[2].padStart(2, '0')}-${birthMatch[1].padStart(2, '0')}`
      : null;
    
    // Extract death date: † DD.MM.YYYY
    const deathMatch = entry.match(/†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    const deathDate = deathMatch 
      ? `${deathMatch[3]}-${deathMatch[2].padStart(2, '0')}-${deathMatch[1].padStart(2, '0')}`
      : null;
    
    // Extract location (line after death date, before image)
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
    let location: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('†') && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Location is a line that doesn't start with [ or ! (not a link/image)
        if (nextLine && !nextLine.startsWith('[') && !nextLine.startsWith('!') && !nextLine.startsWith('#')) {
          location = nextLine;
          break;
        }
      }
    }
    
    // Extract photo URL: ![](url) or ![...](url)
    const photoMatch = entry.match(/!\[[^\]]*\]\(([^)]+)\)/);
    let photoUrl: string | null = null;
    if (photoMatch) {
      const url = photoMatch[1];
      // Only accept valid image URLs
      if (url && !url.includes('icon') && !url.includes('logo') && 
          (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp'))) {
        photoUrl = url;
      }
    }
    
    obituaries.push({
      name,
      birth_date: birthDate,
      death_date: deathDate,
      death_date_confirmed: deathDate !== null,
      publication_date: today,
      location: location || 'Pinkafeld',
      text: null,
      source,
      photo_url: photoUrl
    });
  }
  
  console.log(`Bestattung Kinelly parser found ${obituaries.length} obituaries`);
  return obituaries;
}

// Parser for Nicklaus Bestattungen format:
// Name (age Jahre)
// [![](imageUrl)](link)
// **Location**
// **Date** 
// Type (Urnenbeisetzung, etc.)
// [Zur Gedenkseite](link)
function parseNicklausBestattungen(markdown: string, source: string): ScrapedObituary[] {
  const obituaries: ScrapedObituary[] = [];
  const today = new Date().toISOString().split('T')[0];
  const seenNames = new Set<string>();
  
  // Pattern 1: # Name (age Jahre) - header format
  const headerPattern = /^#+\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s+\((\d+)\s+Jahre\)/gm;
  
  let match;
  while ((match = headerPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    const age = match[2];
    const lowerName = name.toLowerCase();
    
    if (seenNames.has(lowerName)) continue;
    
    // Validate name (at least first + last name)
    const nameParts = name.split(/\s+/).filter(p => p.length > 1);
    if (nameParts.length < 2) continue;
    
    seenNames.add(lowerName);
    
    // Look for photo URL after this entry
    const followingText = markdown.substring(match.index, match.index + 1000);
    
    // Extract photo URL from [![](url)](link) pattern - skip SVG placeholders
    const photoMatch = followingText.match(/\[!\[\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)\]/i);
    let photoUrl: string | null = null;
    if (photoMatch && !photoMatch[1].includes('svg') && !photoMatch[1].includes('data:image')) {
      photoUrl = photoMatch[1];
    }
    
    // Extract location from **Location** pattern
    const locationMatch = followingText.match(/\*\*([A-ZÄÖÜ][a-zäöüß\s]+(?:Friedhof|kath\.|ev\.)?[^*]*)\*\*/);
    let location: string | null = null;
    if (locationMatch) {
      const loc = locationMatch[1].trim();
      // Skip date patterns and funeral-related terms
      if (!loc.match(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|im\s+engsten)/i)) {
        location = loc;
      }
    }
    
    obituaries.push({
      name,
      birth_date: null,
      death_date: null, // Nicklaus doesn't show exact death date, only age
      death_date_confirmed: false,
      publication_date: today,
      location: location || 'Karlstadt',
      text: age ? `${age} Jahre` : null,
      source,
      photo_url: photoUrl
    });
  }
  
  // Pattern 2: Plain name followed by (age Jahre) - non-header format
  const plainPattern = /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*\n+\((\d+)\s+Jahre\)/gm;
  
  while ((match = plainPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    const age = match[2];
    const lowerName = name.toLowerCase();
    
    if (seenNames.has(lowerName)) continue;
    
    // Validate name
    const nameParts = name.split(/\s+/).filter(p => p.length > 1);
    if (nameParts.length < 2) continue;
    
    seenNames.add(lowerName);
    
    // Look for photo URL
    const followingText = markdown.substring(match.index, match.index + 1000);
    const photoMatch = followingText.match(/\[!\[\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)\]/i);
    let photoUrl: string | null = null;
    if (photoMatch && !photoMatch[1].includes('svg') && !photoMatch[1].includes('data:image')) {
      photoUrl = photoMatch[1];
    }
    
    // Extract location
    const locationMatch = followingText.match(/\*\*([A-ZÄÖÜ][a-zäöüß\s]+(?:Friedhof|kath\.|ev\.)?[^*]*)\*\*/);
    let location: string | null = null;
    if (locationMatch) {
      const loc = locationMatch[1].trim();
      if (!loc.match(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|im\s+engsten)/i)) {
        location = loc;
      }
    }
    
    obituaries.push({
      name,
      birth_date: null,
      death_date: null,
      death_date_confirmed: false,
      publication_date: today,
      location: location || 'Karlstadt',
      text: age ? `${age} Jahre` : null,
      source,
      photo_url: photoUrl
    });
  }
  
  console.log(`Nicklaus Bestattungen parser found ${obituaries.length} obituaries`);
  return obituaries;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const { sourceUrl, sourceName, sources, historical } = body as {
      sourceUrl?: string;
      sourceName?: string;
      sources?: string[];
      historical?: { sources: string[]; months: string[] }; // e.g., { sources: ['augsburg', 'faz'], months: ['januar-2025', 'februar-2025'] }
    };

    const allSources = OBITUARY_SOURCES.map((s) => ({ id: s.id, url: s.url, name: s.name }));

    // Historical source URL mapping for monthly archives
    const HISTORICAL_BASE_URLS: Record<string, string> = {
      'augsburg': 'https://trauer.augsburger-allgemeine.de/traueranzeigen-suche/monat-',
      'die-glocke': 'https://trauer.die-glocke.de/traueranzeigen-suche/monat-',
      'faz': 'https://lebenswege.faz.net/traueranzeigen-suche/monat-',
      'rheinmain': 'https://trauer-rheinmain.de/traueranzeigen-suche/monat-',
      'stuttgart': 'https://www.stuttgart-gedenkt.de/traueranzeigen-suche/monat-',
      'nrw': 'https://trauer-in-nrw.de/traueranzeigen-suche/monat-',
      'muenster': 'https://www.trauer.ms/traueranzeigen-suche/monat-',
      'wirtrauern': 'https://www.wirtrauern.de/traueranzeigen-suche/monat-',
      'mannheim': 'https://trauer.mannheimer-morgen.de/traueranzeigen-suche/monat-',
      'hamburger-trauer': 'https://hamburgertrauer.de/traueranzeigen-suche/monat-',
      'trauerundgedenken': 'https://www.trauerundgedenken.de/traueranzeigen-suche/monat-',
      'dortmund': 'https://sich-erinnern.de/traueranzeigen-suche/monat-',
    };

    // If specific URL provided, scrape that; otherwise scrape selected sources (or all)
    let urlsToScrape: Array<{ id?: string; url: string; name: string }> = [];
    
    if (historical && historical.sources && historical.months) {
      // Historical mode: generate URLs for each source + month combination
      for (const sourceId of historical.sources) {
        const sourceInfo = allSources.find(s => s.id === sourceId);
        const baseUrl = HISTORICAL_BASE_URLS[sourceId];
        if (sourceInfo && baseUrl) {
          for (const month of historical.months) {
            urlsToScrape.push({
              id: sourceId,
              url: `${baseUrl}${month}`,
              name: `${sourceInfo.name} (${month})`
            });
          }
        } else if (sourceInfo) {
          console.log(`No historical URL template for source: ${sourceId}`);
        }
      }
      console.log(`Historical scraping: ${urlsToScrape.length} URLs to process`);
    } else if (sourceUrl) {
      urlsToScrape = [{ url: sourceUrl, name: sourceName || 'Manuell' }];
    } else if (Array.isArray(sources) && sources.length > 0) {
      const selected = allSources.filter((s) => sources.includes(s.id));
      urlsToScrape = selected.map((s) => ({ id: s.id, url: s.url, name: s.name }));
    } else {
      urlsToScrape = allSources.map((s) => ({ id: s.id, url: s.url, name: s.name }));
    }

    const results = {
      scraped: 0,
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
      bySource: {} as Record<string, { parsed: number; inserted: number }>
    };

    // If the caller passed specific source IDs, record unknown IDs
    if (!sourceUrl && Array.isArray(sources) && sources.length > 0) {
      const knownIds = new Set(allSources.map((s) => s.id));
      const unknown = sources.filter((id) => !knownIds.has(id));
      for (const id of unknown) {
        results.errors.push(`Unbekannte Quelle: ${id}`);
      }
    }

    // Keep runtime below typical request timeouts (prevents "Load failed" on the client)
    const startedAt = Date.now();
    const MAX_RUNTIME_MS = 55000;

    // Rate limiting: max 9 requests per minute = ~6.7s between requests
    // We use 7 seconds to stay safely under the limit
    const DELAY_BETWEEN_REQUESTS_MS = 7000;
    
    // Max 2 pages processed in parallel (we process sequentially but track for future)
    const MAX_CONCURRENT = 2;
    
    let hardStopReason: string | null = null;
    let requestsThisMinute = 0;
    let minuteStartTime = Date.now();

    for (let i = 0; i < urlsToScrape.length; i++) {
      const source = urlsToScrape[i];

      if (Date.now() - startedAt > MAX_RUNTIME_MS) {
        hardStopReason = 'Zeitlimit erreicht – bitte erneut starten (wird in Batches verarbeitet).';
        results.errors.push(hardStopReason);
        break;
      }

      // Rate limiting: reset counter every minute
      if (Date.now() - minuteStartTime > 60000) {
        requestsThisMinute = 0;
        minuteStartTime = Date.now();
      }

      // If we've made 9 requests this minute, wait for the minute to end
      if (requestsThisMinute >= 9) {
        const waitTime = 60000 - (Date.now() - minuteStartTime) + 1000;
        console.log(`Rate limit: waiting ${Math.round(waitTime / 1000)}s for next minute window`);
        await delay(waitTime);
        requestsThisMinute = 0;
        minuteStartTime = Date.now();
      }

      // Add delay between requests (skip first one) - ensures max 9 per minute
      if (i > 0) {
        await delay(DELAY_BETWEEN_REQUESTS_MS);
      }
      
      requestsThisMinute++;

      try {
        console.log(`Processing source ${i + 1}/${urlsToScrape.length}: ${source.name}`);
        const scrapeResult = await scrapeUrl(source.url, firecrawlKey);
        results.scraped++;

        const markdown = scrapeResult.data?.markdown || scrapeResult.markdown || '';
        if (!markdown) {
          console.log(`No markdown content from ${source.name}`);
          results.bySource[source.name] = { parsed: 0, inserted: 0 };
          continue;
        }

        const obituaries = parseObituariesFromMarkdown(markdown, source.name);
        results.bySource[source.name] = { parsed: obituaries.length, inserted: 0 };

        for (const obituary of obituaries) {
          // Check if already exists (by name and birth_date only - not death_date)
          let query = supabase
            .from('obituaries')
            .select('id, photo_url')
            .eq('name', obituary.name);
          
          // Match birth_date: both null OR both equal
          if (obituary.birth_date) {
            query = query.eq('birth_date', obituary.birth_date);
          } else {
            query = query.is('birth_date', null);
          }
          
          const { data: existing } = await query.maybeSingle();

          if (!existing) {
            // Prepare insert data: use death_date only if confirmed, otherwise use publication_date as fallback
            // The DB requires death_date to be NOT NULL, so we use publication_date as fallback
            const insertData = {
              name: obituary.name,
              birth_date: obituary.birth_date,
              death_date: obituary.death_date_confirmed ? obituary.death_date : obituary.publication_date,
              publication_date: obituary.publication_date,
              location: obituary.location,
              text: obituary.text,
              source: obituary.source,
              photo_url: obituary.photo_url,
            };
            
            const { error: insertError } = await supabase
              .from('obituaries')
              .insert(insertData);

            if (insertError) {
              console.error('Insert error:', insertError);
              results.errors.push(`Failed to insert ${obituary.name}: ${insertError.message}`);
            } else {
              results.inserted++;
              results.bySource[source.name].inserted++;
            }
          } else {
            // Update photo_url if existing entry has none but new data has one
            if (!existing.photo_url && obituary.photo_url) {
              const { error: updateError } = await supabase
                .from('obituaries')
                .update({ photo_url: obituary.photo_url })
                .eq('id', existing.id);
              
              if (updateError) {
                console.error('Photo URL update error:', updateError);
              } else {
                console.log(`Updated photo_url for ${obituary.name}`);
              }
            }
            results.skipped++;
          }
        }
      } catch (sourceError) {
        const errorMsg = sourceError instanceof Error ? sourceError.message : 'Unknown error';
        console.error(`Error processing ${source.name}:`, errorMsg);

        if (errorMsg === 'INSUFFICIENT_CREDITS') {
          hardStopReason = 'Scraping-Kontingent ist aufgebraucht. Bitte Kontingent erhöhen oder später erneut versuchen.';
          results.errors.push(`${source.name}: ${hardStopReason}`);
          break;
        }

        if (errorMsg === 'RATE_LIMIT_EXCEEDED') {
          // Stop early to avoid long waits/timeouts
          hardStopReason = 'Rate-Limit erreicht. Bitte in 1–2 Minuten erneut starten.';
          results.errors.push(`${source.name}: ${hardStopReason}`);
          break;
        }

        results.errors.push(`${source.name}: ${errorMsg}`);
      }
    }

    // === UPDATE LAST RUN TIMESTAMP ===
    console.log('Updating last_run_at timestamp...');
    const { error: updateLastRunError } = await supabase
      .from('scraper_settings')
      .update({ last_run_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (updateLastRunError) {
      console.error('Error updating last_run_at:', updateLastRunError);
    } else {
      console.log('last_run_at updated successfully');
    }

    // === POST-SCRAPING CLEANUP ===
    
    // 1. Remove duplicates (same name, birth_date, death_date - keep oldest)
    console.log('Running duplicate cleanup...');
    const { data: duplicates, error: dupError } = await supabase.rpc('find_duplicate_obituaries');
    
    let duplicatesRemoved = 0;
    if (!dupError && duplicates && duplicates.length > 0) {
      const idsToDelete = duplicates.map((d: { id: string }) => d.id);
      const { error: deleteError } = await supabase
        .from('obituaries')
        .delete()
        .in('id', idsToDelete);
      
      if (!deleteError) {
        duplicatesRemoved = idsToDelete.length;
        console.log(`Removed ${duplicatesRemoved} duplicates`);
      } else {
        console.error('Error deleting duplicates:', deleteError);
        results.errors.push(`Duplikat-Bereinigung fehlgeschlagen: ${deleteError.message}`);
      }
    }
    
    // 2. Remove non-person entries (organizations, institutions, placeholders)
    console.log('Running non-person cleanup...');
    const nonPersonPatterns = [
      '%GmbH%', '%AG%', '%e.V.%', '%e. V.%', '%Stiftung%', '%Verein%',
      '%Gemeinde%', '%Stadt %', '%Landkreis%', '%Firma%', '%Institut%',
      '%Bestattung%', '%Friedhof%', '%Krankenhaus%', '%Klinik%',
      '%Testanzeige%', '%Musteranzeige%', '%Beispiel%', '%Demo%',
      '%Unbekannt%', '%N.N.%', '%NN%'
    ];
    
    let nonPersonsRemoved = 0;
    for (const pattern of nonPersonPatterns) {
      const { data: matches, error: matchError } = await supabase
        .from('obituaries')
        .select('id')
        .ilike('name', pattern);
      
      if (!matchError && matches && matches.length > 0) {
        const idsToDelete = matches.map((m: { id: string }) => m.id);
        const { error: deleteError } = await supabase
          .from('obituaries')
          .delete()
          .in('id', idsToDelete);
        
        if (!deleteError) {
          nonPersonsRemoved += idsToDelete.length;
        }
      }
    }
    
    if (nonPersonsRemoved > 0) {
      console.log(`Removed ${nonPersonsRemoved} non-person entries`);
    }

    if (hardStopReason) {
      console.log('Scraping stopped early:', hardStopReason);
      return new Response(
        JSON.stringify({
          success: false,
          error: hardStopReason,
          details: { ...results, duplicatesRemoved, nonPersonsRemoved },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping complete:', JSON.stringify(results, null, 2));
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Scraped ${results.scraped} sources, inserted ${results.inserted} new obituaries (${results.skipped} already existed). Cleanup: ${duplicatesRemoved} Duplikate, ${nonPersonsRemoved} Nicht-Personen entfernt.`,
        details: { ...results, duplicatesRemoved, nonPersonsRemoved }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-obituaries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape obituaries';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});