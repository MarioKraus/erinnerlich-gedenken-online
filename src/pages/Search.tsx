import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SearchForm from "@/components/search/SearchForm";
import ObituaryCard, { Obituary } from "@/components/obituary/ObituaryCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const Search = () => {
  const [searchParams] = useSearchParams();
  const [obituaries, setObituaries] = useState<Obituary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const nameQuery = searchParams.get("name") || "";
  const locationQuery = searchParams.get("location") || "";
  const dateQuery = searchParams.get("date") || "";

  useEffect(() => {
    const fetchObituaries = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from("obituaries")
        .select("*", { count: "exact" });

      if (nameQuery) {
        query = query.ilike("name", `%${nameQuery}%`);
      }
      if (locationQuery) {
        query = query.ilike("location", `%${locationQuery}%`);
      }
      if (dateQuery) {
        query = query.eq("death_date", dateQuery);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order("death_date", { ascending: false })
        .range(from, to);

      if (!error && data) {
        setObituaries(data);
        setTotalCount(count || 0);
      }
      setIsLoading(false);
    };

    fetchObituaries();
  }, [nameQuery, locationQuery, dateQuery, currentPage]);

  // Reset page when search params change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameQuery, locationQuery, dateQuery]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasActiveSearch = nameQuery || locationQuery || dateQuery;

  return (
    <Layout>
      <Helmet>
        <title>Traueranzeigen suchen - Erinnerlich</title>
        <meta 
          name="description" 
          content="Suchen Sie nach Traueranzeigen aus ganz Deutschland. Finden Sie Informationen zu Trauerfeiern und Beileidsbekundungen." 
        />
      </Helmet>

      <section className="py-10 md:py-16 bg-memorial-warm border-b border-border">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-6 text-center">
            Traueranzeigen suchen
          </h1>
          <div className="max-w-4xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container">
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
                  Versuchen Sie es mit anderen Suchbegriffen.
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
