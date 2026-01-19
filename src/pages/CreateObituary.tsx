import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import bgCreate from "@/assets/bg-create.jpg";
import { PAGE_COLORS } from "@/lib/colorVariations";

const CreateObituary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    deathDate: "",
    location: "",
    text: "",
    photoUrl: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.deathDate) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte geben Sie mindestens den Namen und das Sterbedatum an.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-public-content", {
        body: {
          type: "obituary",
          data: {
            name: formData.name.trim(),
            birth_date: formData.birthDate || null,
            death_date: formData.deathDate,
            location: formData.location.trim() || null,
            text: formData.text.trim() || null,
            photo_url: formData.photoUrl.trim() || null,
          },
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        if (data.code === "RATE_LIMITED") {
          toast({
            title: "Zu viele Anfragen",
            description: "Bitte versuchen Sie es später erneut.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast({
        title: "Traueranzeige erstellt",
        description: "Ihre Traueranzeige wurde erfolgreich veröffentlicht.",
      });

      navigate(`/traueranzeige/${data.data.id}`);
    } catch (error) {
      console.error("Error creating obituary:", error);
      toast({
        title: "Fehler",
        description: "Die Traueranzeige konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Layout>
      <Helmet>
        <title>Traueranzeige aufgeben - Erinnerlich</title>
        <meta 
          name="description" 
          content="Erstellen Sie eine würdevolle Traueranzeige für Ihre Angehörigen. Einfach, respektvoll und schnell." 
        />
      </Helmet>

      <section className="relative py-16 md:py-24 border-b border-border overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${bgCreate})`,
            filter: `sepia(18%) hue-rotate(${PAGE_COLORS.create.hue - 140}deg) saturate(110%)`
          }}
        />
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(to bottom, hsla(${PAGE_COLORS.create.hue}, 22%, 25%, 0.4), hsla(${PAGE_COLORS.create.hue}, 18%, 20%, 0.3), hsl(var(--background)))`
          }}
        />
        
        <div className="relative z-10 container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4 drop-shadow-lg">
              Traueranzeige aufgeben
            </h1>
            <p className="text-white/90 drop-shadow-md">
              Gedenken Sie Ihren Angehörigen mit einer würdevollen Traueranzeige.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container">
          <div className="max-w-xl mx-auto">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    s === step
                      ? "bg-primary"
                      : s < step
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="memorial-card p-8">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                    <h2 className="font-serif text-xl font-medium text-foreground">
                      Persönliche Angaben
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Grundlegende Informationen zur verstorbenen Person
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Vor- und Nachname"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Geburtsdatum</Label>
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deathDate">Sterbedatum *</Label>
                      <Input
                        id="deathDate"
                        name="deathDate"
                        type="date"
                        value={formData.deathDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ort</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Stadt oder Gemeinde"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Photo & Text */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                    <h2 className="font-serif text-xl font-medium text-foreground">
                      Foto und Text
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fügen Sie ein Foto und einen persönlichen Text hinzu
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Foto-URL (optional)</Label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="photoUrl"
                        name="photoUrl"
                        placeholder="https://beispiel.de/foto.jpg"
                        value={formData.photoUrl}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fügen Sie die URL eines bereits hochgeladenen Bildes ein.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text">Trauertext</Label>
                    <Textarea
                      id="text"
                      name="text"
                      placeholder="In Liebe und Dankbarkeit nehmen wir Abschied..."
                      value={formData.text}
                      onChange={handleInputChange}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Verfassen Sie einen persönlichen Nachruf oder Trauertext.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                    <h2 className="font-serif text-xl font-medium text-foreground">
                      Überprüfen und Veröffentlichen
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bitte überprüfen Sie Ihre Angaben
                    </p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{formData.name || "–"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Geburtsdatum</span>
                      <span className="font-medium">{formData.birthDate || "–"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Sterbedatum</span>
                      <span className="font-medium">{formData.deathDate || "–"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Ort</span>
                      <span className="font-medium">{formData.location || "–"}</span>
                    </div>
                    {formData.text && (
                      <div className="py-2">
                        <span className="text-muted-foreground block mb-2">Trauertext</span>
                        <p className="text-foreground whitespace-pre-line">
                          {formData.text}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-memorial-warm p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Basis-Anzeige (kostenlos)</strong><br />
                      Ihre Traueranzeige wird sofort veröffentlicht und ist für alle sichtbar.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Weiter
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird veröffentlicht...
                      </>
                    ) : (
                      <>
                        Veröffentlichen
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateObituary;
