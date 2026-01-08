import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import AdvancedSearchForm, { SearchFilter } from "@/components/search/AdvancedSearchForm";
import ObituaryCard, { Obituary } from "@/components/obituary/ObituaryCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import bgSearch from "@/assets/bg-search.jpg";

const ITEMS_PER_PAGE = 12;

// Convert wildcard pattern (* ) to SQL ILIKE pattern (%)
const wildcardToLike = (value: string): string => {
  return value.replace(/\*/g, "%");
};

// Parse date with wildcards (e.g., "*.01.2026" -> { year: "2026", month: "01" })
const parseDateWithWildcard = (value: string): { year?: string; month?: string; day?: string } => {
  // Try German format DD.MM.YYYY
  const germanMatch = value.match(/^(\d{1,2}|\*)\.(\d{1,2}|\*)\.(\d{4})$/);
  if (germanMatch) {
    return {
      day: germanMatch[1] !== "*" ? germanMatch[1].padStart(2, "0") : undefined,
      month: germanMatch[2] !== "*" ? germanMatch[2].padStart(2, "0") : undefined,
      year: germanMatch[3],
    };
  }
  
  // Just a year
  if (/^\d{4}$/.test(value)) {
    return { year: value };
  }

  return {};
};

const Search = () => {
  const [obituaries, setObituaries] = useState<Obituary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);

  const fetchObituaries = useCallback(async (filters: SearchFilter[], page: number) => {
    setIsLoading(true);

    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // If no filters, fetch all
      if (filters.length === 0) {
        const { data, error, count } = await supabase
          .from("obituaries")
          .select("*", { count: "exact" })
          .order("death_date", { ascending: false })
          .range(from, to);

        if (!error && data) {
          setObituaries(data);
          setTotalCount(count || 0);
        }
        setIsLoading(false);
        return;
      }

      // Build query with filters
      let query = supabase
        .from("obituaries")
        .select("*", { count: "exact" });

      // Separate text-based and date-based filters
      const textFilters: SearchFilter[] = [];
      const dateFilters: SearchFilter[] = [];
      
      for (const filter of filters) {
        const value = filter.value.trim();
        if (!value) continue;

        if (["geburtsdatum", "sterbedatum", "geburtsjahr", "sterbejahr"].includes(filter.field)) {
          dateFilters.push(filter);
        } else {
          textFilters.push(filter);
        }
      }

      // Apply date filters (AND logic)
      for (const filter of dateFilters) {
        const value = filter.value.trim();

        if (filter.field === "geburtsdatum") {
          const parts = parseDateWithWildcard(value);
          if (parts.year && parts.month && parts.day) {
            query = query.eq("birth_date", `${parts.year}-${parts.month}-${parts.day}`);
          } else if (parts.year) {
            query = query.gte("birth_date", `${parts.year}-01-01`);
            query = query.lte("birth_date", `${parts.year}-12-31`);
          }
        } else if (filter.field === "sterbedatum") {
          const parts = parseDateWithWildcard(value);
          if (parts.year && parts.month && parts.day) {
            query = query.eq("death_date", `${parts.year}-${parts.month}-${parts.day}`);
          } else if (parts.year) {
            query = query.gte("death_date", `${parts.year}-01-01`);
            query = query.lte("death_date", `${parts.year}-12-31`);
          }
        } else if (filter.field === "geburtsjahr") {
          const year = value.replace("*", "");
          if (year) {
            query = query.gte("birth_date", `${year}-01-01`);
            query = query.lte("birth_date", `${year}-12-31`);
          }
        } else if (filter.field === "sterbejahr") {
          const year = value.replace("*", "");
          if (year) {
            query = query.gte("death_date", `${year}-01-01`);
            query = query.lte("death_date", `${year}-12-31`);
          }
        }
      }

      // Apply text filters
      if (textFilters.length > 0) {
        const orParts: string[] = [];
        
        for (const filter of textFilters) {
          const value = filter.value.trim();
          const likeValue = wildcardToLike(value);

          switch (filter.field) {
            case "name":
              orParts.push(`name.ilike.%${likeValue}%`);
              orParts.push(`location.ilike.%${likeValue}%`);
              break;
            case "nachname":
            case "vorname":
              orParts.push(`name.ilike.%${likeValue}%`);
              break;
            case "ort":
              orParts.push(`location.ilike.%${likeValue}%`);
              break;
            case "quelle":
              orParts.push(`source.ilike.%${likeValue}%`);
              break;
          }
        }

        if (orParts.length > 0) {
          query = query.or(orParts.join(","));
        }
      }

      const { data, error, count } = await query
        .order("death_date", { ascending: false })
        .range(from, to);

      if (!error && data) {
        setObituaries(data);
        setTotalCount(count || 0);
      } else {
        console.error("Search error:", error);
        setObituaries([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Search error:", error);
      setObituaries([]);
      setTotalCount(0);
    }

    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchObituaries(activeFilters, currentPage);
  }, [currentPage, fetchObituaries, activeFilters]);

  // Handle search
  const handleSearch = useCallback((filters: SearchFilter[]) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasActiveSearch = activeFilters.length > 0;

  // Get field label for display
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: "Name/Ort",
      nachname: "Nachname",
      vorname: "Vorname",
      ort: "Ort",
      geburtsdatum: "Geburtsdatum",
      sterbedatum: "Sterbedatum",
      geburtsjahr: "Geburtsjahr",
      sterbejahr: "Sterbejahr",
      quelle: "Quelle",
    };
    return labels[field] || field;
  };

  return (
    <Layout>
      <Helmet>
        <title>Traueranzeigen suchen - Erinnerlich</title>
        <meta 
          name="description" 
          content="Suchen Sie nach Traueranzeigen aus ganz Deutschland. Finden Sie Informationen zu Trauerfeiern und Beileidsbekundungen." 
        />
      </Helmet>

      <section className="relative py-16 md:py-24 border-b border-border overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgSearch})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
        
        <div className="relative z-10 container">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6 text-center drop-shadow-lg">
            Traueranzeigen suchen
          </h1>
          <div className="max-w-4xl mx-auto">
            <AdvancedSearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container">
          {/* Active filters summary */}
          {hasActiveSearch && (
            <div className="mb-6 p-4 bg-memorial-warm rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Aktive Filter:</span>{" "}
                {activeFilters.map((f, i) => (
                  <span key={f.id}>
                    {i > 0 && <span className="text-primary font-medium"> {f.operator} </span>}
                    {getFieldLabel(f.field)}: „{f.value}"
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-muted-foreground">
                {isLoading ? (
                  "Suche läuft..."
                ) : totalCount === 0 ? (
                  hasActiveSearch ? (
                    "Keine Traueranzeigen gefunden"
                  ) : (
                    "Alle Traueranzeigen"
                  )
                ) : (
                  `${totalCount} Traueranzeige${totalCount !== 1 ? "n" : ""} gefunden`
                )}
              </p>
            </div>
          </div>

          {/* Results grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : obituaries.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {obituaries.map((obituary) => (
                  <ObituaryCard key={obituary.id} obituary={obituary} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-4">
                    Seite {currentPage} von {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-2">
                {hasActiveSearch
                  ? "Keine Traueranzeigen für Ihre Suche gefunden."
                  : "Noch keine Traueranzeigen vorhanden."}
              </p>
              {hasActiveSearch && (
                <p className="text-sm text-muted-foreground">
                  Versuchen Sie es mit anderen Suchbegriffen oder verwenden Sie * als Platzhalter.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Search;
