import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real German obituary portal URLs
const OBITUARY_SOURCES = [
  // National portals
  { id: 'trauer-de', name: 'Trauer.de', url: 'https://www.trauer.de/traueranzeigen-aus-deutschland' },
  { id: 'trauer-anzeigen', name: 'Trauer-Anzeigen.de', url: 'https://trauer-anzeigen.de/' },
  
  // Major newspapers
  { id: 'sueddeutsche', name: 'Süddeutsche Zeitung', url: 'https://trauer.sueddeutsche.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'faz', name: 'Frankfurter Allgemeine', url: 'https://lebenswege.faz.net/' },
  { id: 'tagesspiegel', name: 'Tagesspiegel', url: 'https://trauer.tagesspiegel.de/' },
  { id: 'merkur', name: 'Münchner Merkur', url: 'https://trauer.merkur.de/' },
  
  // Regional portals
  { id: 'hz', name: 'Heidenheimer Zeitung', url: 'https://trauer.hz.de/' },
  { id: 'rz', name: 'Rhein-Zeitung', url: 'https://rz-trauer.de/' },
  { id: 'gn', name: 'Grafschafter Nachrichten', url: 'https://trauer.gn-online.de/' },
  { id: 'ok', name: 'Oberhessische Presse', url: 'https://www.ok-trauer.de/' },
  
  // Memorial portals
  { id: 'viternity', name: 'Viternity', url: 'https://www.viternity.org/' },
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
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 2000,
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
  
  // Blacklist of non-name strings
  const blacklist = ['prominente trauerfälle', 'aktuelle traueranzeigen', 'weitere trauerfälle', 
                     'neueste kerzen', 'unsere trauerchats', 'trauerhilfe', 'trauervideos'];
  
  // Pattern 1: "Traueranzeige von [Name] von [source]" format (merkur, many regional papers)
  const traueranzeigenPattern = /Traueranzeige von\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s+von\s+\w+/gi;
  let match;
  while ((match = traueranzeigenPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (name && !seenNames.has(name.toLowerCase()) && !blacklist.includes(name.toLowerCase())) {
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
  
  // Pattern 2: Markdown link with name in alt text like [![Name](...)]
  const imgLinkPattern = /\[!\[([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\]/g;
  while ((match = imgLinkPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    // Skip generic names like "Kerze von..." or "Bild vom..."
    if (name && !seenNames.has(name.toLowerCase()) && 
        !name.toLowerCase().includes('kerze') && 
        !name.toLowerCase().includes('bild')) {
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

  // Pattern 3: Bold names with dates (common format: **Name** *01.01.1940 - †14.12.2025)
  const boldNamePattern = /\*\*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\*\*/g;
  while ((match = boldNamePattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (name && !seenNames.has(name.toLowerCase()) && name.split(' ').length >= 2) {
      // Try to find dates near this name
      const surroundingText = markdown.substring(
        Math.max(0, match.index - 50), 
        Math.min(markdown.length, match.index + 200)
      );
      const deathDate = extractDeathDate(surroundingText) || today;
      const birthDate = extractBirthDate(surroundingText);
      
      seenNames.add(name.toLowerCase());
      obituaries.push({
        name,
        birth_date: birthDate,
        death_date: deathDate,
        location: extractLocationFromText(surroundingText) || extractLocationFromSource(source),
        text: null,
        source,
        photo_url: null
      });
    }
  }
  
  // Pattern 4: Header names (## Name or ### Name)
  const headerPattern = /^#{1,4}\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)\s*$/gm;
  while ((match = headerPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    if (name && !seenNames.has(name.toLowerCase()) && 
        name.split(' ').length >= 2 &&
        !name.toLowerCase().includes('traueranzeige') &&
        !name.toLowerCase().includes('trauerhilfe')) {
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

  console.log(`Parser found ${obituaries.length} obituaries with patterns`);
  return obituaries;
}

function extractDeathDate(text: string): string | null {
  // Look for death date markers
  const deathPatterns = [
    /[†✝]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /gestorben\s*(?:am\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
    /verstorben\s*(?:am\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i,
    /-\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/
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
  // Look for birth date markers
  const birthPatterns = [
    /[*]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/,
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

function extractLocationFromText(text: string): string | null {
  const locationPatterns = [
    /(?:aus|in|wohnhaft\s+in)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/i,
    /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+)/
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[match.length - 1];
    }
  }
  return null;
}

function extractLocationFromSource(source: string): string | null {
  // Map sources to likely locations
  const sourceLocationMap: Record<string, string> = {
    'Münchner Merkur': 'München',
    'Süddeutsche Zeitung': 'München',
    'Frankfurter Allgemeine': 'Frankfurt',
    'Tagesspiegel': 'Berlin',
    'Rhein-Zeitung': 'Koblenz',
    'Heidenheimer Zeitung': 'Heidenheim',
    'Grafschafter Nachrichten': 'Nordhorn',
    'Oberhessische Presse': 'Marburg'
  };
  return sourceLocationMap[source] || null;
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

    const { sourceUrl, sourceName } = await req.json();
    
    // If specific URL provided, scrape that; otherwise scrape all sources
    const urlsToScrape = sourceUrl 
      ? [{ url: sourceUrl, name: sourceName || 'Manuell' }]
      : OBITUARY_SOURCES.map(s => ({ url: s.url, name: s.name }));

    const results = {
      scraped: 0,
      inserted: 0,
      errors: [] as string[]
    };

    for (const source of urlsToScrape) {
      try {
        console.log(`Processing source: ${source.name}`);
        const scrapeResult = await scrapeUrl(source.url, firecrawlKey);
        results.scraped++;

        const markdown = scrapeResult.data?.markdown || scrapeResult.markdown || '';
        if (!markdown) {
          console.log(`No markdown content from ${source.name}`);
          continue;
        }

        const obituaries = parseObituariesFromMarkdown(markdown, source.name);
        console.log(`Parsed ${obituaries.length} obituaries from ${source.name}`);

        for (const obituary of obituaries) {
          // Check if already exists (by name and death_date)
          const { data: existing } = await supabase
            .from('obituaries')
            .select('id')
            .eq('name', obituary.name)
            .eq('death_date', obituary.death_date)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('obituaries')
              .insert(obituary);

            if (insertError) {
              console.error('Insert error:', insertError);
              results.errors.push(`Failed to insert ${obituary.name}: ${insertError.message}`);
            } else {
              results.inserted++;
            }
          }
        }
      } catch (sourceError) {
        const errorMsg = sourceError instanceof Error ? sourceError.message : 'Unknown error';
        console.error(`Error processing ${source.name}:`, errorMsg);
        results.errors.push(`${source.name}: ${errorMsg}`);
      }
    }

    console.log('Scraping complete:', results);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Scraped ${results.scraped} sources, inserted ${results.inserted} new obituaries`,
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
