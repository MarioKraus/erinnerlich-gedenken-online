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
  
  // Parse death dates - common German formats
  const datePatterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/g, // DD.MM.YYYY
    /(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/gi
  ];

  // Extract names - typically in bold or headers
  const namePattern = /(?:^|\n)(?:#+\s*)?[\*\*]?([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)+)[\*\*]?/g;
  
  // Simple extraction - in production this would be more sophisticated
  const lines = markdown.split('\n');
  let currentObituary: Partial<ScrapedObituary> = {};
  
  for (const line of lines) {
    // Look for name patterns (typically bold or in headers)
    const nameMatch = line.match(/[\*\*#]+\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)+)/);
    if (nameMatch) {
      // Save previous if exists
      if (currentObituary.name && currentObituary.death_date) {
        obituaries.push({
          name: currentObituary.name,
          birth_date: currentObituary.birth_date || null,
          death_date: currentObituary.death_date,
          location: currentObituary.location || null,
          text: currentObituary.text || null,
          source,
          photo_url: null
        });
      }
      currentObituary = { name: nameMatch[1], source };
    }

    // Look for dates
    const dateMatch = line.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Check if this is birth or death date based on context
      if (line.toLowerCase().includes('geboren') || line.includes('*')) {
        currentObituary.birth_date = dateStr;
      } else if (line.toLowerCase().includes('gestorben') || line.includes('†') || line.includes('verstorben')) {
        currentObituary.death_date = dateStr;
      } else if (!currentObituary.death_date) {
        // Default to death date if unclear
        currentObituary.death_date = dateStr;
      }
    }

    // Look for location
    const locationPatterns = [
      /(?:aus|in|wohnhaft)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/i,
      /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+)/
    ];
    for (const pattern of locationPatterns) {
      const locationMatch = line.match(pattern);
      if (locationMatch) {
        currentObituary.location = locationMatch[locationMatch.length - 1];
        break;
      }
    }

    // Accumulate text
    if (currentObituary.name && line.trim()) {
      currentObituary.text = (currentObituary.text || '') + line + '\n';
    }
  }

  // Don't forget the last one
  if (currentObituary.name && currentObituary.death_date) {
    obituaries.push({
      name: currentObituary.name,
      birth_date: currentObituary.birth_date || null,
      death_date: currentObituary.death_date,
      location: currentObituary.location || null,
      text: currentObituary.text?.trim() || null,
      source,
      photo_url: null
    });
  }

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
