import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import AdvancedSearchForm, { SearchFilter } from "@/components/search/AdvancedSearchForm";
import ObituaryCard, { Obituary } from "@/components/obituary/ObituaryCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import bgSearch from "@/assets/bg-search.jpg";
import { PAGE_COLORS } from "@/lib/colorVariations";

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
  const [searchParams, setSearchParams] = useSearchParams();

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

      // Apply text filters with proper AND/OR logic
      if (textFilters.length > 0) {
        // Group filters by operator logic
        // First filter is always AND (base filter)
        // Subsequent filters use their operator to connect to previous
        
        // Build filter condition for a single filter
        const buildFilterCondition = (filter: SearchFilter): string => {
          const value = filter.value.trim();
          const likeValue = wildcardToLike(value);
          
          switch (filter.field) {
            case "name":
              // For simple search, check both name and location
              return `name.ilike.%${likeValue}%,location.ilike.%${likeValue}%`;
            case "nachname":
            case "vorname":
              return `name.ilike.%${likeValue}%`;
            case "ort":
              return `location.ilike.%${likeValue}%`;
            case "quelle":
              return `source.ilike.%${likeValue}%`;
            default:
              return "";
          }
        };

        // Check if all filters use AND operator
        const allAnd = textFilters.every((f, i) => i === 0 || f.operator === "AND");
        
        // Check if all filters use OR operator
        const allOr = textFilters.every((f, i) => i === 0 || f.operator === "OR");

        if (allAnd) {
          // All AND: Apply each filter sequentially (intersection)
          for (const filter of textFilters) {
            const condition = buildFilterCondition(filter);
            if (condition) {
              // For AND, we need to apply each as a separate .or() for the same field
              // This ensures each filter must match (AND between filters)
              query = query.or(condition);
            }
          }
        } else if (allOr) {
          // All OR: Combine all conditions into one .or() call
          const allConditions: string[] = [];
          for (const filter of textFilters) {
            const condition = buildFilterCondition(filter);
            if (condition) {
              allConditions.push(condition);
            }
          }
          if (allConditions.length > 0) {
            query = query.or(allConditions.join(","));
          }
        } else {
          // Mixed operators: Process in order, grouping consecutive ORs
          // This is a simplified approach - group OR filters together, AND between groups
          const groups: { filters: SearchFilter[]; operator: "AND" | "OR" }[] = [];
          let currentGroup: SearchFilter[] = [textFilters[0]];
          
          for (let i = 1; i < textFilters.length; i++) {
            const filter = textFilters[i];
            if (filter.operator === "OR") {
              currentGroup.push(filter);
            } else {
              // AND operator - save current group and start new one
              groups.push({ filters: currentGroup, operator: "OR" });
              currentGroup = [filter];
            }
          }
          groups.push({ filters: currentGroup, operator: "OR" });

          // Apply each group - groups are ANDed together
          for (const group of groups) {
            const groupConditions: string[] = [];
            for (const filter of group.filters) {
              const condition = buildFilterCondition(filter);
              if (condition) {
                groupConditions.push(condition);
              }
            }
            if (groupConditions.length > 0) {
              query = query.or(groupConditions.join(","));
            }
          }
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

  // Hydrate filters from URL (?name=&date=&source=) e.g. from the compact SearchForm
  useEffect(() => {
    const name = (searchParams.get("name") || "").trim();
    const date = (searchParams.get("date") || "").trim();
    const source = (searchParams.get("source") || "").trim();

    const urlFilters: SearchFilter[] = [];
    if (name) urlFilters.push({ id: "url-name", field: "name", value: name, operator: "AND" });
    if (date) urlFilters.push({ id: "url-date", field: "sterbedatum", value: date, operator: "AND" });
    if (source) urlFilters.push({ id: "url-source", field: "quelle", value: source, operator: "AND" });

    // Only hydrate if user hasn't started a search yet.
    if (urlFilters.length > 0 && activeFilters.length === 0) {
      setActiveFilters(urlFilters);
      setCurrentPage(1);
    }
  }, [searchParams, activeFilters.length]);

  // Initial / reactive load
  useEffect(() => {
    fetchObituaries(activeFilters, currentPage);
  }, [currentPage, fetchObituaries, activeFilters]);

  // Handle search
  const handleSearch = useCallback(
    (filters: SearchFilter[]) => {
      setActiveFilters(filters);
      setCurrentPage(1);

      // Keep URL in sync for simple shareable searches
      const next = new URLSearchParams();
      for (const f of filters) {
        if (f.field === "name") next.set("name", f.value);
        if (f.field === "sterbedatum") next.set("date", f.value);
        if (f.field === "quelle") next.set("source", f.value);
      }
      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );

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

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5; // Number of pages to show around current
    
    if (totalPages <= 9) {
      // Show all pages if 9 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - Math.floor(showPages / 2));
      let end = Math.min(totalPages - 1, currentPage + Math.floor(showPages / 2));
      
      // Adjust if at the beginning
      if (currentPage <= 4) {
        start = 2;
        end = 6;
      }
      
      // Adjust if at the end
      if (currentPage >= totalPages - 3) {
        start = totalPages - 5;
        end = totalPages - 1;
      }
      
      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push("ellipsis");
      }
      
      // Add pages in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
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
          style={{ 
            backgroundImage: `url(${bgSearch})`,
            filter: `sepia(15%) hue-rotate(${PAGE_COLORS.search.hue - 140}deg) saturate(95%)`
          }}
        />
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(to bottom, hsla(${PAGE_COLORS.search.hue}, 18%, 22%, 0.4), hsla(${PAGE_COLORS.search.hue}, 15%, 18%, 0.3), hsl(var(--background)))`
          }}
        />
        
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
                <div className="flex flex-wrap items-center justify-center gap-1 mt-12">
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Erste Seite"
                    className="hidden sm:inline-flex"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Previous page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Vorherige Seite"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1 mx-1">
                    {getPageNumbers().map((page, index) => 
                      page === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          className="w-9 h-9"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  
                  {/* Next page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Nächste Seite"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Letzte Seite"
                    className="hidden sm:inline-flex"
                  >
                    <ChevronsRight className="h-4 w-4" />
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
