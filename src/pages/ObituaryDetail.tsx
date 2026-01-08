import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Loader2, Heart, MessageSquare, ExternalLink, Edit } from "lucide-react";
import CandleModal from "@/components/obituary/CandleModal";
import CondolenceModal from "@/components/obituary/CondolenceModal";
import EditObituaryModal from "@/components/obituary/EditObituaryModal";
import CandlesList from "@/components/obituary/CandlesList";
import CondolencesList from "@/components/obituary/CondolencesList";
import bgObituaryDetail from "@/assets/bg-obituary-detail.jpg";
import avatarForestBg from "@/assets/avatar-forest-bg.jpg";

// Map source names to their base URLs for linking
const SOURCE_URL_MAP: Record<string, string> = {
  'Trauer-Anzeigen.de': 'https://trauer-anzeigen.de/',
  'Tagesspiegel': 'https://trauer.tagesspiegel.de/',
  'Hamburger Abendblatt': 'https://hamburgertrauer.de/',
  'Süddeutsche Zeitung': 'https://trauer.sueddeutsche.de/',
  'Münchner Merkur': 'https://trauer.merkur.de/',
  'Kölner Stadt-Anzeiger': 'https://www.wirtrauern.de/',
  'Frankfurter Allgemeine': 'https://lebenswege.faz.net/',
  'Frankfurter Rundschau': 'https://trauer-rheinmain.de/',
  'Stuttgarter Zeitung': 'https://www.stuttgart-gedenkt.de/',
  'Rheinische Post': 'https://trauer.rp-online.de/',
  'Ruhr Nachrichten': 'https://sich-erinnern.de/',
  'WAZ': 'https://www.trauer.de/',
  'Weser Kurier': 'https://trauer.weser-kurier.de/',
  'Nürnberger Nachrichten': 'https://trauer.nn.de/',
  'Niederrhein Nachrichten': 'https://www.trauer.niederrhein-nachrichten.de/',
  'Trauer NRW': 'https://trauer-in-nrw.de/',
  'Wuppertaler Rundschau': 'https://trauer.wuppertaler-rundschau.de/',
  'Neue Westfälische': 'https://trauer.nw.de/',
  'General-Anzeiger Bonn': 'https://trauer.ga.de/',
  'Westfälische Nachrichten': 'https://www.trauer.ms/',
  'Mannheimer Morgen': 'https://trauer.mannheimer-morgen.de/',
  'BNN Karlsruhe': 'https://trauer.bnn.de/',
  'Augsburger Allgemeine': 'https://trauer.augsburger-allgemeine.de/',
  'Heidenheimer Zeitung': 'https://trauer.hz.de/',
  'Rhein-Zeitung': 'https://rz-trauer.de/',
  'Mainpost': 'https://trauer.mainpost.de/',
  'VRM Trauer': 'https://vrm-trauer.de/',
  'Die Glocke': 'https://trauer.die-glocke.de/',
  'Saarbrücker Zeitung': 'https://saarbruecker-zeitung.trauer.de/',
  'HNA': 'https://trauer.hna.de/',
  'Freie Presse': 'https://gedenken.freiepresse.de/',
  'Westfalen Nachrichten': 'https://wn-trauer.de/',
  'Trierischer Volksfreund': 'https://volksfreund.trauer.de/',
  'Hersfelder Zeitung': 'https://trauer.hersfelder-zeitung.de/',
  'Kreiszeitung': 'https://trauer.kreiszeitung.de/',
  'WLZ': 'https://trauer.wlz.de/',
  'Fränkische Nachrichten': 'https://trauer.fnweb.de/',
  'SVZ': 'https://svz.de/traueranzeigen/',
  'Trauerfall.de': 'https://trauerfall.de/',
  'Heimatfriedhof.online': 'https://heimatfriedhof.online/',
  'Trauer und Gedenken': 'https://www.trauerundgedenken.de/',
};

interface Obituary {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string;
  location: string | null;
  text: string | null;
  source: string | null;
  photo_url: string | null;
  created_at: string;
  birth_location?: string | null;
  death_location?: string | null;
  funeral_date?: string | null;
  funeral_location?: string | null;
  funeral_time?: string | null;
  mourners?: string | null;
  publication_date?: string | null;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getSourceUrl = (source: string | null): string | null => {
  if (!source) return null;
  return SOURCE_URL_MAP[source] || null;
};

const ObituaryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [obituary, setObituary] = useState<Obituary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candleModalOpen, setCandleModalOpen] = useState(false);
  const [condolenceModalOpen, setCondolenceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Simple admin check - in production, use proper auth
  const isAdmin = window.location.search.includes("admin=true") || localStorage.getItem("isAdmin") === "true";

  useEffect(() => {
    const fetchObituary = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("obituaries")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setObituary(data as Obituary);
      }
      setIsLoading(false);
    };

    fetchObituary();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: de });
    } catch {
      return dateString;
    }
  };

  const handleCandleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["candles", id] });
  };

  const handleCondolenceSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["condolences", id] });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (notFound || !obituary) {
    return (
      <Layout>
        <Helmet>
          <title>Nicht gefunden - Erinnerlich</title>
        </Helmet>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
            Traueranzeige nicht gefunden
          </h1>
          <p className="text-muted-foreground mb-8">
            Die gesuchte Traueranzeige existiert nicht oder wurde entfernt.
          </p>
          <Link to="/suche">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Suche
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const getLifeSpan = () => {
    const birth = obituary.birth_date ? formatDate(obituary.birth_date) : null;
    const death = formatDate(obituary.death_date);
    
    if (birth && death) {
      return `* ${birth} – † ${death}`;
    }
    return `† ${death}`;
  };

  const sourceUrl = getSourceUrl(obituary.source);

  return (
    <Layout>
      <Helmet>
        <title>{obituary.name} - Traueranzeige | Erinnerlich</title>
        <meta 
          name="description" 
          content={`Traueranzeige für ${obituary.name}. ${obituary.text?.substring(0, 150) || "Gedenken Sie in Stille."}`} 
        />
      </Helmet>

      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgObituaryDetail})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />
        
        <div className="relative z-10 container h-full flex items-end justify-between pb-6">
          <Link 
            to="/suche" 
            className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Suche
          </Link>
          
          {isAdmin && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      <article className="py-10 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            {/* Main Card */}
            <div className="memorial-card p-8 md:p-12">
              {/* Photo and Name */}
              <div className="text-center mb-8">
                {obituary.photo_url ? (
                  <div className="w-32 h-40 md:w-40 md:h-48 mx-auto mb-6 rounded-lg overflow-hidden shadow-soft">
                    <img 
                      src={obituary.photo_url} 
                      alt={obituary.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-32 h-40 md:w-40 md:h-48 mx-auto mb-6 rounded-lg overflow-hidden shadow-soft flex items-center justify-center relative"
                    style={{
                      backgroundImage: `url(${avatarForestBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="relative font-serif text-5xl text-white drop-shadow-lg">
                      {getInitials(obituary.name)}
                    </span>
                  </div>
                )}

                <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-3">
                  {obituary.name}
                </h1>

                <p className="font-serif text-lg text-muted-foreground">
                  {getLifeSpan()}
                </p>
              </div>

              {/* Divider */}
              <div className="memorial-divider" />

              {/* Text */}
              {obituary.text && (
                <div className="prose prose-lg max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-line text-center md:text-left">
                    {obituary.text}
                  </p>
                </div>
              )}

              {/* Mourners */}
              {obituary.mourners && (
                <div className="mt-6 text-center md:text-left">
                  <p className="text-muted-foreground italic whitespace-pre-line">
                    {obituary.mourners}
                  </p>
                </div>
              )}

              {/* Details */}
              <div className="mt-8 space-y-3">
                {obituary.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{obituary.location}</span>
                  </div>
                )}

                {obituary.funeral_date && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Beisetzung: {formatDate(obituary.funeral_date)}
                      {obituary.funeral_time && ` um ${obituary.funeral_time}`}
                      {obituary.funeral_location && `, ${obituary.funeral_location}`}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Veröffentlicht am {formatDate(obituary.publication_date || obituary.created_at)}</span>
                </div>

                {obituary.source && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {sourceUrl ? (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-memorial-warm px-2 py-1 rounded hover:bg-memorial-warm/80 transition-colors inline-flex items-center gap-1"
                      >
                        Quelle: {obituary.source}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs bg-memorial-warm px-2 py-1 rounded">
                        Quelle: {obituary.source}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setCandleModalOpen(true)}
              >
                <Heart className="h-4 w-4" />
                Kerze anzünden
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setCondolenceModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                Kondolenz schreiben
              </Button>
            </div>

            {/* Candles List */}
            <CandlesList obituaryId={obituary.id} />

            {/* Condolences List */}
            <CondolencesList obituaryId={obituary.id} />
          </div>
        </div>
      </article>

      {/* Modals */}
      <CandleModal
        open={candleModalOpen}
        onOpenChange={setCandleModalOpen}
        obituaryId={obituary.id}
        obituaryName={obituary.name}
        onSuccess={handleCandleSuccess}
      />
      <CondolenceModal
        open={condolenceModalOpen}
        onOpenChange={setCondolenceModalOpen}
        obituaryId={obituary.id}
        obituaryName={obituary.name}
        onSuccess={handleCondolenceSuccess}
      />
      
      {isAdmin && (
        <EditObituaryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          obituary={obituary}
          onSuccess={() => {
            // Refetch obituary
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
};

export default ObituaryDetail;