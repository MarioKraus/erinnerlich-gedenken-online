import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Optimized German obituary portal URLs - using pages with actual listings
const OBITUARY_SOURCES = [
  // National portals with listings
  { id: 'trauer-anzeigen', name: 'Trauer-Anzeigen.de', url: 'https://trauer-anzeigen.de/' },
  
  // Major newspapers with obituary listings
  { id: 'sueddeutsche', name: 'Süddeutsche Zeitung', url: 'https://trauer.sueddeutsche.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'tagesspiegel', name: 'Tagesspiegel', url: 'https://trauer.tagesspiegel.de/' },
  { id: 'merkur', name: 'Münchner Merkur', url: 'https://trauer.merkur.de/' },
  
  // Regional portals
  { id: 'hz', name: 'Heidenheimer Zeitung', url: 'https://trauer.hz.de/' },
  { id: 'rz', name: 'Rhein-Zeitung', url: 'https://rz-trauer.de/' },
  { id: 'gn', name: 'Grafschafter Nachrichten', url: 'https://trauer.gn-online.de/' },
  { id: 'ok', name: 'Oberhessische Presse', url: 'https://www.ok-trauer.de/' },
];

interface ScrapedObituary {
  name: string;
  birth_date: string | null;
  death_date: string;
  location: string | null;
  text: string | null;
  source: string;
  photo_url: string | null;
}

async function scrapeUrl(url: string, apiKey: string): Promise<any> {
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
    const error = await response.text();
    console.error(`Scrape failed for ${url}:`, error);
    throw new Error(`Failed to scrape ${url}`);
  }

  return response.json();
}

function parseObituariesFromMarkdown(markdown: string, source: string): ScrapedObituary[] {
  const obituaries: ScrapedObituary[] = [];
  const today = new Date().toISOString().split('T')[0];
  const seenNames = new Set<string>();
  
  // Blacklist of non-name strings (lowercase)
  const blacklist = new Set([
    'prominente trauerfälle', 'aktuelle traueranzeigen', 'weitere trauerfälle', 
    'neueste kerzen', 'unsere trauerchats', 'trauerhilfe', 'trauervideos',
    'trauerhilfe live-chat', 'anzeige aufgeben', 'kai sender', 'traueranzeigen',
    'fragen & antworten', 'die trauerphasen', 'trauernde geschwister',
    'die sterbehilfe', 'die palliativstation', 'das hospiz', 'meinungen der teilnehmer',
    'expertenchat jeden', 'unsere trauerchats', 'traueranzeige aufgeben'
  ]);

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
  const traueranzeigenPattern = /Traueranzeige von\s+([A-ZÄÖÜ][a-zäöüß]+(?:[-\s]+[A-ZÄÖÜ]?[a-zäöüß]+)*)\s+von\s+/gi;
  while ((match = traueranzeigenPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (isValidName(name)) {
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: null,
        death_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
      });
    }
  }

  // Pattern 2: "## [Anzeige Name](url)" - Süddeutsche format
  // Example: ## [Anzeige Jürgen Rakoski](https://...)
  const anzeigeHeaderPattern = /##\s*\[Anzeige\s+([A-ZÄÖÜ][^\]]+)\]/gi;
  while ((match = anzeigeHeaderPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (isValidName(name)) {
      // Look for dates after this match
      const followingText = markdown.substring(match.index, match.index + 200);
      const deathDate = extractDeathDate(followingText) || today;
      const birthDate = extractBirthDate(followingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
      });
    }
  }

  // Pattern 3: Name with dates in format "* DD.MM.YYYY - † DD.MM.YYYY"
  // This catches entries with birth and death dates
  const nameWithDatesPattern = /([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*\n?\s*\\\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*-\s*†\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/gi;
  while ((match = nameWithDatesPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (isValidName(name)) {
      const [, , birthDay, birthMonth, birthYear, deathDay, deathMonth, deathYear] = match;
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
        death_date: `${deathYear}-${deathMonth.padStart(2, '0')}-${deathDay.padStart(2, '0')}`,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
      });
    }
  }

  // Pattern 4: Image links with name - catches format [![Name](image)](link)
  // But only if not a "Kerze" or utility image
  const imgAltPattern = /\[!\[(?:Traueranzeige von\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/gi;
  while ((match = imgAltPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (isValidName(name)) {
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: null,
        death_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
      });
    }
  }

  // Pattern 5: Links to obituary pages like [Name](https://.../traueranzeige/slug)
  const obituaryLinkPattern = /\[([A-ZÄÖÜ][^\]]+)\]\([^)]*\/traueranzeige\/[^)]+\)/gi;
  while ((match = obituaryLinkPattern.exec(markdown)) !== null) {
    let name = match[1].trim();
    // Clean up prefixes like "Anzeige "
    name = name.replace(/^Anzeige\s+/i, '');
    if (isValidName(name)) {
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: null,
        death_date: today,
        location: extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
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
    'Münchner Merkur': 'München',
    'Süddeutsche Zeitung': 'München',
    'Frankfurter Allgemeine': 'Frankfurt',
    'Tagesspiegel': 'Berlin',
    'Rhein-Zeitung': 'Koblenz',
    'Heidenheimer Zeitung': 'Heidenheim',
    'Grafschafter Nachrichten': 'Nordhorn',
    'Oberhessische Presse': 'Marburg',
    'Trauer-Anzeigen.de': null
  };
  return sourceLocationMap[source] ?? null;
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
    
    const { sourceUrl, sourceName } = body as { sourceUrl?: string; sourceName?: string };
    
    // If specific URL provided, scrape that; otherwise scrape all sources
    const urlsToScrape = sourceUrl 
      ? [{ url: sourceUrl, name: sourceName || 'Manuell' }]
      : OBITUARY_SOURCES.map(s => ({ url: s.url, name: s.name }));

    const results = {
      scraped: 0,
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
      bySource: {} as Record<string, { parsed: number; inserted: number }>
    };

    for (const source of urlsToScrape) {
      try {
        console.log(`Processing source: ${source.name}`);
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
          // Check if already exists (by name and death_date)
          const { data: existing } = await supabase
            .from('obituaries')
            .select('id')
            .eq('name', obituary.name)
            .eq('death_date', obituary.death_date)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('obituaries')
              .insert(obituary);

            if (insertError) {
              console.error('Insert error:', insertError);
              results.errors.push(`Failed to insert ${obituary.name}: ${insertError.message}`);
            } else {
              results.inserted++;
              results.bySource[source.name].inserted++;
            }
          } else {
            results.skipped++;
          }
        }
      } catch (sourceError) {
        const errorMsg = sourceError instanceof Error ? sourceError.message : 'Unknown error';
        console.error(`Error processing ${source.name}:`, errorMsg);
        results.errors.push(`${source.name}: ${errorMsg}`);
      }
    }

    console.log('Scraping complete:', JSON.stringify(results, null, 2));
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Scraped ${results.scraped} sources, inserted ${results.inserted} new obituaries (${results.skipped} already existed)`,
        details: results
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