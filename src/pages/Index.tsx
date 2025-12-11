import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import SearchForm from "@/components/search/SearchForm";
import ObituaryCard, { Obituary } from "@/components/obituary/ObituaryCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Heart, Flower2, BookOpen } from "lucide-react";

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
        <title>Erinnerlich - Traueranzeigen und Gedenken</title>
        <meta 
          name="description" 
          content="Ein würdevoller Ort für Traueranzeigen und Gedenken. Suchen Sie Traueranzeigen oder geben Sie selbst eine Anzeige auf." 
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-memorial-warm to-background">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-up">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6 leading-tight">
              In stillem Gedenken
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Ein Ort der Erinnerung und des Trostes. Hier finden Sie Traueranzeigen 
              und können das Andenken an Ihre Liebsten bewahren.
            </p>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <SearchForm variant="hero" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-memorial-warm flex items-center justify-center">
                <Heart className="h-6 w-6 text-memorial-violet" />
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                Würdevolles Gedenken
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bewahren Sie das Andenken an geliebte Menschen in einer respektvollen Umgebung.
              </p>
            </div>

            <div className="text-center p-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-memorial-warm flex items-center justify-center">
                <Flower2 className="h-6 w-6 text-memorial-violet" />
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                Virtuelle Anteilnahme
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drücken Sie Ihre Anteilnahme mit Kondolenzeinträgen und virtuellen Kerzen aus.
              </p>
            </div>

            <div className="text-center p-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-memorial-warm flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-memorial-violet" />
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                Einfache Erstellung
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Erstellen Sie Traueranzeigen schnell und unkompliziert für Ihre Angehörigen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Obituaries Section */}
      <section className="py-16 md:py-24 bg-memorial-warm">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">
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
                <div key={i} className="memorial-card animate-pulse">
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
          ) : recentObituaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentObituaries.map((obituary) => (
                <ObituaryCard key={obituary.id} obituary={obituary} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Noch keine Traueranzeigen vorhanden.
              </p>
              <Link to="/anzeige-erstellen" className="mt-4 inline-block">
                <Button>Erste Anzeige erstellen</Button>
              </Link>
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

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
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
