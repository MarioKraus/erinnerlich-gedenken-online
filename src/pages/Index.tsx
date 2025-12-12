import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SearchForm from "@/components/search/SearchForm";
import ObituaryCard, { Obituary } from "@/components/obituary/ObituaryCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Calendar, ArrowRight } from "lucide-react";
import heroForest from "@/assets/hero-forest.jpg";

const Index = () => {
  const [recentObituaries, setRecentObituaries] = useState<Obituary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentObituaries = async () => {
      const { data, error } = await supabase
        .from("obituaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        setRecentObituaries(data);
      }
      setIsLoading(false);
    };

    fetchRecentObituaries();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Erinnerlich - Das Trauerportal für Deutschland</title>
        <meta 
          name="description" 
          content="Wir geben Ihrer Trauer einen Raum. Durchsuchen Sie aktuelle Traueranzeigen aus deutschen Tageszeitungen oder veröffentlichen Sie eine würdevolle Anzeige." 
        />
      </Helmet>

      {/* Hero Section with Forest Image */}
      <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroForest})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent" />
        
        <div className="relative z-10 container text-center py-16">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-4 leading-tight drop-shadow-lg">
            Wir geben Ihrer Trauer einen Raum
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
            Das Trauerportal für Deutschland
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative -mt-16 z-20 pb-16">
        <div className="container max-w-4xl">
          <SearchForm variant="hero" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">
                Traueranzeigen <span className="text-primary">finden</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Durchsuchen Sie aktuelle Traueranzeigen aus deutschen Tageszeitungen
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">
                Anzeige aufgeben
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Veröffentlichen Sie eine würdevolle Traueranzeige für Ihre Liebsten
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">
                Stets aktuell
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stündlich aktualisierte Traueranzeigen aus allen Quellen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Obituaries Section */}
      {recentObituaries.length > 0 && (
        <section className="py-16 md:py-20 bg-memorial-warm">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                  Aktuelle Traueranzeigen
                </h2>
                <p className="text-muted-foreground mt-2">
                  Die neuesten Traueranzeigen aus ganz Deutschland
                </p>
              </div>
              <Link to="/suche">
                <Button variant="outline" className="hidden sm:flex gap-2">
                  Alle anzeigen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-24 rounded bg-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentObituaries.map((obituary) => (
                  <ObituaryCard key={obituary.id} obituary={obituary} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link to="/suche">
                <Button variant="outline" className="gap-2">
                  Alle Traueranzeigen anzeigen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Traueranzeige aufgeben
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Gedenken Sie Ihren Angehörigen mit einer würdevollen Traueranzeige. 
              Einfach, respektvoll und für alle zugänglich.
            </p>
            <Link to="/anzeige-erstellen">
              <Button size="lg" className="gap-2">
                Anzeige erstellen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
