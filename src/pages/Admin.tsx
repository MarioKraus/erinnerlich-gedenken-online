import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw, Database, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NEWSPAPER_SOURCES = [
  // Nationale Portale
  { id: "trauer-de", name: "Trauer.de", url: "https://www.trauer.de" },
  { id: "trauer-anzeigen", name: "Trauer-Anzeigen.de", url: "https://trauer-anzeigen.de" },
  
  // Große Zeitungen
  { id: "sueddeutsche", name: "Süddeutsche Zeitung", url: "https://trauer.sueddeutsche.de" },
  { id: "faz", name: "Frankfurter Allgemeine", url: "https://lebenswege.faz.net" },
  { id: "tagesspiegel", name: "Tagesspiegel", url: "https://trauer.tagesspiegel.de" },
  { id: "merkur", name: "Münchner Merkur", url: "https://trauer.merkur.de" },
  
  // Regionale Portale
  { id: "hz", name: "Heidenheimer Zeitung", url: "https://trauer.hz.de" },
  { id: "rz", name: "Rhein-Zeitung", url: "https://rz-trauer.de" },
  { id: "gn", name: "Grafschafter Nachrichten", url: "https://trauer.gn-online.de" },
  { id: "ok", name: "Oberhessische Presse", url: "https://www.ok-trauer.de" },
  
  // Gedenkportale
  { id: "viternity", name: "Viternity", url: "https://www.viternity.org" },
];

const Admin = () => {
  const { toast } = useToast();
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);

  const { data: obituaryStats, refetch: refetchStats } = useQuery({
    queryKey: ["obituary-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("obituaries")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("obituaries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      const { data: recentObituaries } = await supabase
        .from("obituaries")
        .select("id, name, source, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        total: total || 0,
        today: todayCount || 0,
        recent: recentObituaries || [],
      };
    },
  });

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-obituaries", {
        body: { sources: NEWSPAPER_SOURCES.map((s) => s.id) },
      });

      if (error) throw error;

      toast({
        title: "Scraping gestartet",
        description: `${data?.processed || 0} Quellen werden verarbeitet.`,
      });

      setTimeout(() => refetchStats(), 5000);
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler beim Scraping",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsScrapingAll(false);
    }
  };

  const handleScrapeSource = async (sourceId: string) => {
    setScrapingSource(sourceId);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-obituaries", {
        body: { sources: [sourceId] },
      });

      if (error) throw error;

      toast({
        title: "Scraping gestartet",
        description: `Quelle "${sourceId}" wird verarbeitet.`,
      });

      setTimeout(() => refetchStats(), 3000);
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler beim Scraping",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setScrapingSource(null);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Admin - Erinnerlich</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-2">
            Scraping-Administration
          </h1>
          <p className="text-muted-foreground">
            Überwachen und steuern Sie das automatische Scraping von Traueranzeigen.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{obituaryStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Traueranzeigen in der Datenbank</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Heute</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{obituaryStats?.today || 0}</div>
              <p className="text-xs text-muted-foreground">Neue Einträge heute</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cron-Job</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Aktiv - Stündlich
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Zur vollen Stunde</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Scraping */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manuelles Scraping</CardTitle>
            <CardDescription>
              Lösen Sie das Scraping manuell aus, um sofort neue Traueranzeigen zu importieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={handleScrapeAll}
                disabled={isScrapingAll || !!scrapingSource}
                className="bg-memorial-forest hover:bg-memorial-forest/90"
              >
                {isScrapingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping läuft...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Alle Quellen scrapen
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => refetchStats()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Statistik aktualisieren
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {NEWSPAPER_SOURCES.map((source) => (
                <Card key={source.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {source.url}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleScrapeSource(source.id)}
                      disabled={isScrapingAll || scrapingSource === source.id}
                    >
                      {scrapingSource === source.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Obituaries */}
        <Card>
          <CardHeader>
            <CardTitle>Zuletzt importiert</CardTitle>
            <CardDescription>
              Die letzten 10 importierten Traueranzeigen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {obituaryStats?.recent && obituaryStats.recent.length > 0 ? (
              <div className="space-y-2">
                {obituaryStats.recent.map((obituary) => (
                  <div
                    key={obituary.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{obituary.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {obituary.source || "Unbekannte Quelle"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(obituary.created_at).toLocaleString("de-DE")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <AlertCircle className="h-5 w-5" />
                <p>Noch keine Traueranzeigen importiert.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
