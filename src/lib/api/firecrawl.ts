import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
  details?: {
    scraped: number;
    inserted: number;
    errors: string[];
  };
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
  location?: { country?: string; languages?: string[] };
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Scrape obituaries from configured sources or a specific URL
  async scrapeObituaries(sourceUrl?: string, sourceName?: string): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('scrape-obituaries', {
      body: { sourceUrl, sourceName },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
