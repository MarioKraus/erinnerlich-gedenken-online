import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, RefreshCw, Database, Clock, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// All configured newspaper sources - synced with edge function
const NEWSPAPER_SOURCES = [
  // National portals
  { id: 'trauer-anzeigen', name: 'Trauer-Anzeigen.de', url: 'https://trauer-anzeigen.de/' },
  { id: 'trauer-de', name: 'Trauer.de', url: 'https://www.trauer.de/traueranzeigen-suche/region-waz--26--lokalkompass' },
  
  // Major cities
  { id: 'hamburger-trauer', name: 'Hamburger Abendblatt', url: 'https://hamburgertrauer.de/traueranzeigen-suche/letzte-14-tage/region-hamburger-abendblatt' },
  { id: 'wirtrauern', name: 'Kölner Stadt-Anzeiger', url: 'https://www.wirtrauern.de/traueranzeigen-suche/letzte-14-tage/region-köln' },
  { id: 'faz', name: 'Frankfurter Allgemeine', url: 'https://lebenswege.faz.net/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'rheinmain', name: 'Frankfurter Rundschau', url: 'https://trauer-rheinmain.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'stuttgart', name: 'Stuttgarter Zeitung', url: 'https://www.stuttgart-gedenkt.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'dortmund', name: 'Ruhr Nachrichten', url: 'https://sich-erinnern.de/traueranzeigen-suche/region-ruhr-nachrichten' },
  { id: 'nrw', name: 'Trauer NRW', url: 'https://trauer-in-nrw.de/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'muenster', name: 'Westfälische Nachrichten', url: 'https://www.trauer.ms/traueranzeigen-suche/aktuelle-ausgabe' },
  { id: 'mannheim', name: 'Mannheimer Morgen', url: 'https://trauer.mannheimer-morgen.de/traueranzeigen-suche/letzte-14-tage' },
  { id: 'augsburg', name: 'Augsburger Allgemeine', url: 'https://trauer.augsburger-allgemeine.de/traueranzeigen-suche/aktuelle-ausgabe' },
  
  // Regional sources
  { id: 'rz', name: 'Rhein-Zeitung', url: 'https://rz-trauer.de/' },
  
  // Other sources
  { id: 'vrm-trauer', name: 'VRM Trauer', url: 'https://vrm-trauer.de/' },
  { id: 'die-glocke', name: 'Die Glocke', url: 'https://trauer.die-glocke.de/' },
  { id: 'saarbruecker', name: 'Saarbrücker Zeitung', url: 'https://saarbruecker-zeitung.trauer.de/' },
  { id: 'freie-presse', name: 'Freie Presse', url: 'https://gedenken.freiepresse.de/' },
  { id: 'wn', name: 'Westfalen Nachrichten', url: 'https://wn-trauer.de/' },
  { id: 'volksfreund', name: 'Trierischer Volksfreund', url: 'https://volksfreund.trauer.de/' },
  { id: 'svz', name: 'SVZ', url: 'https://svz.de/traueranzeigen/' },
  { id: 'trauerfall', name: 'Trauerfall.de', url: 'https://trauerfall.de/' },
  
  // Community portals
  { id: 'heimatfriedhof', name: 'Heimatfriedhof.online', url: 'https://heimatfriedhof.online/' },
  { id: 'trauerundgedenken', name: 'Trauer und Gedenken', url: 'https://www.trauerundgedenken.de/traueranzeigen-suche/letzte-14-tage' },
];

const CRON_OPTIONS = [
  { value: '33 13 * * *', label: 'Täglich um 13:33 Uhr' },
  { value: '0 8 * * *', label: 'Täglich um 8:00 Uhr' },
  { value: '0 12 * * *', label: 'Täglich um 12:00 Uhr' },
  { value: '0 18 * * *', label: 'Täglich um 18:00 Uhr' },
  { value: '0 */6 * * *', label: 'Alle 6 Stunden' },
  { value: '0 */12 * * *', label: 'Alle 12 Stunden' },
];

interface SourceStats {
  source: string;
  count: number;
  lastImportCount: number;
  lastImportAt: string | null;
}

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);
  const [scrapingSources, setScrapingSources] = useState<Set<string>>(new Set());
  const [totalExpanded, setTotalExpanded] = useState(false);
  const [todayExpanded, setTodayExpanded] = useState(false);

  // Fetch source statistics
  const { data: sourceStats } = useQuery({
    queryKey: ["source-stats"],
    queryFn: async () => {
      // Get counts by source
      const { data: counts } = await supabase
        .from("obituaries")
        .select("source")
        .order("source");
      
      const countMap: Record<string, number> = {};
      counts?.forEach((item) => {
        const src = item.source || "Unbekannt";
        countMap[src] = (countMap[src] || 0) + 1;
      });

      // Get last import info (last 48 hours grouped by source)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: recentBySource } = await supabase
        .from("obituaries")
        .select("source, created_at")
        .gte("created_at", fortyEightHoursAgo)
        .order("created_at", { ascending: false });

      const lastImportMap: Record<string, { count: number; lastAt: string | null }> = {};
      recentBySource?.forEach((item) => {
        const src = item.source || "Unbekannt";
        if (!lastImportMap[src]) {
          lastImportMap[src] = { count: 0, lastAt: null };
        }
        lastImportMap[src].count++;
        if (!lastImportMap[src].lastAt || item.created_at > lastImportMap[src].lastAt!) {
          lastImportMap[src].lastAt = item.created_at;
        }
      });

      const stats: SourceStats[] = NEWSPAPER_SOURCES.map((source) => ({
        source: source.name,
        count: countMap[source.name] || 0,
        lastImportCount: lastImportMap[source.name]?.count || 0,
        lastImportAt: lastImportMap[source.name]?.lastAt || null,
      }));

      return stats;
    },
  });

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

      // Get obituaries from last 48 hours
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: recentObituaries } = await supabase
        .from("obituaries")
        .select("id, name, source, created_at")
        .gte("created_at", fortyEightHoursAgo)
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: allObituaries } = await supabase
        .from("obituaries")
        .select("id, name, source, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: todayObituaries } = await supabase
        .from("obituaries")
        .select("id, name, source, created_at")
        .gte("created_at", today)
        .order("created_at", { ascending: false })
        .limit(50);

      return {
        total: total || 0,
        today: todayCount || 0,
        recent: recentObituaries || [],
        allList: allObituaries || [],
        todayList: todayObituaries || [],
      };
    },
  });

  const { data: scraperSettings, refetch: refetchSettings } = useQuery<{
    id: string;
    cron_interval: string;
    is_active: boolean;
    last_run_at: string | null;
  }>({
    queryKey: ["scraper-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraper_settings" as any)
        .select("*")
        .single();
      
      if (error) {
        console.error("Error fetching scraper settings:", error);
        return { id: '', cron_interval: '0 * * * *', is_active: true, last_run_at: null };
      }
      return data as any;
    },
  });

  const updateCronMutation = useMutation({
    mutationFn: async (newInterval: string) => {
      // Call edge function to update the actual pg_cron job
      const { data, error } = await supabase.functions.invoke("update-cron-schedule", {
        body: { cron_interval: newInterval },
      });
      
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || "Failed to update cron");
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Intervall aktualisiert",
        description: "Das Scraping-Intervall und der Cron-Job wurden erfolgreich geändert.",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    },
  });

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    setScrapingSources(new Set());

    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const chunk = <T,>(arr: T[], size: number) => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    try {
      const sourceIds = NEWSPAPER_SOURCES.map((s) => s.id);
      const batches = chunk(sourceIds, 4);

      let totalScraped = 0;
      let totalInserted = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Update which sources are currently being scraped
        setScrapingSources(new Set(batch));

        const { data, error } = await supabase.functions.invoke("scrape-obituaries", {
          body: { sources: batch },
        });

        if (error) throw error;

        if (data?.success === false) {
          if (data?.error) allErrors.push(data.error);
          if (data?.details?.errors?.length) allErrors.push(...data.details.errors);
          break;
        }

        totalScraped += data?.details?.scraped || 0;
        totalInserted += data?.details?.inserted || 0;
        totalSkipped += data?.details?.skipped || 0;
        if (data?.details?.errors?.length) allErrors.push(...data.details.errors);

        // small pause between batches to avoid client/network timeouts
        await sleep(1500);
      }

      toast({
        title: allErrors.length ? "Scraping beendet (mit Hinweisen)" : "Scraping abgeschlossen",
        description: `${totalScraped} Quellen verarbeitet. ${totalInserted} neue Einträge. ${totalSkipped} übersprungen.`,
        variant: allErrors.length ? "destructive" : undefined,
      });

      // Update last run time
      if (scraperSettings?.id) {
        await supabase
          .from("scraper_settings" as any)
          .update({ last_run_at: new Date().toISOString() })
          .eq("id", scraperSettings.id);
      }

      setTimeout(() => {
        refetchStats();
        refetchSettings();
        queryClient.invalidateQueries({ queryKey: ["source-stats"] });
      }, 2000);
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler beim Scraping",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsScrapingAll(false);
      setScrapingSources(new Set());
    }
  };

  const handleScrapeSource = async (sourceId: string) => {
    setScrapingSource(sourceId);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-obituaries", {
        body: { sources: [sourceId] },
      });

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data?.error || "Scraping fehlgeschlagen");
      }

      toast({
        title: "Scraping abgeschlossen",
        description: `${data?.details?.inserted || 0} neue Einträge importiert.`,
      });

      setTimeout(() => {
        refetchStats();
        queryClient.invalidateQueries({ queryKey: ["source-stats"] });
      }, 2000);
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

  const getCronLabel = (cronValue: string) => {
    return CRON_OPTIONS.find(o => o.value === cronValue)?.label || cronValue;
  };

  const getSourceStatsForName = (sourceName: string): SourceStats | undefined => {
    return sourceStats?.find((s) => s.source === sourceName);
  };

  const ObituaryListItem = ({ obituary }: { obituary: { id: string; name: string; source: string | null; created_at: string } }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
      <div className="flex-1 min-w-0">
        <Link 
          to={`/traueranzeige/${obituary.id}`}
          className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
        >
          {obituary.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {obituary.source || "Unbekannte Quelle"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(obituary.created_at).toLocaleString("de-DE")}
        </p>
        <Link 
          to={`/traueranzeige/${obituary.id}`}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <Layout>
      <Helmet>
        <title>Admin - Erinnerlich</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-2">
              Scraping-Administration
            </h1>
            <p className="text-muted-foreground">
              Überwachen und steuern Sie das automatische Scraping von Traueranzeigen.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const isAdmin = localStorage.getItem("isAdmin") === "true";
              localStorage.setItem("isAdmin", isAdmin ? "false" : "true");
              window.location.reload();
            }}
          >
            {localStorage.getItem("isAdmin") === "true" ? "Admin-Modus: AN" : "Admin-Modus: AUS"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Collapsible open={totalExpanded} onOpenChange={setTotalExpanded}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CollapsibleTrigger className="w-full text-left group">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary cursor-pointer hover:underline">
                      {obituaryStats?.total || 0}
                    </div>
                    {totalExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Traueranzeigen in der Datenbank</p>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {obituaryStats?.allList?.map((obituary) => (
                    <ObituaryListItem key={obituary.id} obituary={obituary} />
                  ))}
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>

          <Collapsible open={todayExpanded} onOpenChange={setTodayExpanded}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Heute</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CollapsibleTrigger className="w-full text-left group">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary cursor-pointer hover:underline">
                      {obituaryStats?.today || 0}
                    </div>
                    {todayExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Neue Einträge heute</p>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {obituaryStats?.todayList && obituaryStats.todayList.length > 0 ? (
                    obituaryStats.todayList.map((obituary) => (
                      <ObituaryListItem key={obituary.id} obituary={obituary} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Noch keine Einträge heute.</p>
                  )}
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>

          {/* Cron Job Card with Controls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cron-Job</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge 
                  variant="secondary" 
                  className={scraperSettings?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}
                >
                  {scraperSettings?.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
                <p className="text-sm font-medium mt-2">
                  {getCronLabel(scraperSettings?.cron_interval || '')}
                </p>
                {scraperSettings?.last_run_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Letzter Lauf: {new Date(scraperSettings.last_run_at).toLocaleString("de-DE")}
                  </p>
                )}
                {!scraperSettings?.last_run_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Noch kein Lauf aufgezeichnet
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Intervall ändern:</label>
                <Select
                  value={scraperSettings?.cron_interval || '33 13 * * *'}
                  onValueChange={(value) => updateCronMutation.mutate(value)}
                  disabled={updateCronMutation.isPending}
                >
                  <SelectTrigger className="h-9 text-sm bg-background">
                    <SelectValue placeholder="Intervall wählen..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {CRON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                onClick={handleScrapeAll}
                disabled={isScrapingAll || !!scrapingSource}
                className="w-full bg-memorial-forest hover:bg-memorial-forest/90"
              >
                {isScrapingAll ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-3 w-3" />
                    Jetzt alle scrapen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Manual Scraping - All Sources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manuelles Scraping</CardTitle>
            <CardDescription>
              {NEWSPAPER_SOURCES.length} konfigurierte Quellen. Klicken Sie auf eine Quelle, um sie einzeln zu scrapen.
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
                    Alle {NEWSPAPER_SOURCES.length} Quellen scrapen
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => {
                refetchStats();
                queryClient.invalidateQueries({ queryKey: ["source-stats"] });
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Statistik aktualisieren
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {NEWSPAPER_SOURCES.map((source) => {
                const stats = getSourceStatsForName(source.name);
                const isSourceScraping = scrapingSource === source.id || (isScrapingAll && scrapingSources.has(source.id));
                
                return (
                  <Card key={source.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <a 
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                        >
                          {source.name}
                        </a>
                        <div className="flex items-center gap-1">
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground truncate hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <span className="truncate max-w-[150px]">{new URL(source.url).hostname}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                        {/* Source statistics */}
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          <p>
                            <span className="font-medium text-foreground">{stats?.count || 0}</span> Einträge
                          </p>
                          {stats?.lastImportCount && stats.lastImportCount > 0 ? (
                            <p className="text-green-600">
                              +{stats.lastImportCount} in letzten 48h
                            </p>
                          ) : (
                            <p className="text-muted-foreground/60">Keine neuen in 48h</p>
                          )}
                          {stats?.lastImportAt && (
                            <p className="text-muted-foreground/80">
                              Letzter: {new Date(stats.lastImportAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleScrapeSource(source.id)}
                        disabled={isScrapingAll || scrapingSource === source.id}
                      >
                        {isSourceScraping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Obituaries - Last 48 hours */}
        <Card>
          <CardHeader>
            <CardTitle>Zuletzt importiert</CardTitle>
            <CardDescription>
              Traueranzeigen der letzten 48 Stunden ({obituaryStats?.recent?.length || 0} Einträge).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {obituaryStats?.recent && obituaryStats.recent.length > 0 ? (
              <div className="space-y-2">
                {obituaryStats.recent.map((obituary) => (
                  <ObituaryListItem key={obituary.id} obituary={obituary} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <AlertCircle className="h-5 w-5" />
                <p>Keine Traueranzeigen in den letzten 48 Stunden importiert.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
