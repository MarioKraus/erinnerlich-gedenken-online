import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Loader2, Heart, MessageSquare } from "lucide-react";
import CandleModal from "@/components/obituary/CandleModal";
import CondolenceModal from "@/components/obituary/CondolenceModal";
import CandlesList from "@/components/obituary/CandlesList";
import CondolencesList from "@/components/obituary/CondolencesList";

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

const ObituaryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [obituary, setObituary] = useState<Obituary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candleModalOpen, setCandleModalOpen] = useState(false);
  const [condolenceModalOpen, setCondolenceModalOpen] = useState(false);

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

  return (
    <Layout>
      <Helmet>
        <title>{obituary.name} - Traueranzeige | Erinnerlich</title>
        <meta 
          name="description" 
          content={`Traueranzeige für ${obituary.name}. ${obituary.text?.substring(0, 150) || "Gedenken Sie in Stille."}`} 
        />
      </Helmet>

      {/* Breadcrumb */}
      <div className="border-b border-border bg-memorial-warm">
        <div className="container py-4">
          <Link 
            to="/suche" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Suche
          </Link>
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
                  <div className="w-32 h-40 md:w-40 md:h-48 mx-auto mb-6 rounded-lg bg-memorial-warm flex items-center justify-center shadow-soft">
                    <span className="font-serif text-5xl text-memorial-stone">
                      {obituary.name.charAt(0)}
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
                    <span className="text-xs bg-memorial-warm px-2 py-1 rounded">
                      Quelle: {obituary.source}
                    </span>
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
    </Layout>
  );
};

export default ObituaryDetail;