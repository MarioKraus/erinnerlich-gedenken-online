import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Obituary {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string;
  location: string | null;
  text: string | null;
  source: string | null;
  photo_url: string | null;
  birth_location?: string | null;
  death_location?: string | null;
  funeral_date?: string | null;
  funeral_location?: string | null;
  funeral_time?: string | null;
  mourners?: string | null;
}

interface EditObituaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obituary: Obituary;
  onSuccess: () => void;
}

const EditObituaryModal = ({ open, onOpenChange, obituary, onSuccess }: EditObituaryModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: obituary.name,
    birth_date: obituary.birth_date || "",
    death_date: obituary.death_date,
    location: obituary.location || "",
    birth_location: obituary.birth_location || "",
    death_location: obituary.death_location || "",
    text: obituary.text || "",
    mourners: obituary.mourners || "",
    photo_url: obituary.photo_url || "",
    source: obituary.source || "",
    funeral_date: obituary.funeral_date?.split("T")[0] || "",
    funeral_time: obituary.funeral_time || "",
    funeral_location: obituary.funeral_location || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: Record<string, any> = {
        name: formData.name,
        death_date: formData.death_date,
        location: formData.location || null,
        birth_location: formData.birth_location || null,
        death_location: formData.death_location || null,
        text: formData.text || null,
        mourners: formData.mourners || null,
        photo_url: formData.photo_url || null,
        source: formData.source || null,
        funeral_time: formData.funeral_time || null,
        funeral_location: formData.funeral_location || null,
      };

      if (formData.birth_date) {
        updateData.birth_date = formData.birth_date;
      } else {
        updateData.birth_date = null;
      }

      if (formData.funeral_date) {
        updateData.funeral_date = formData.funeral_date;
      } else {
        updateData.funeral_date = null;
      }

      const { error } = await supabase
        .from("obituaries")
        .update(updateData)
        .eq("id", obituary.id);

      if (error) throw error;

      toast({
        title: "Gespeichert",
        description: "Die Traueranzeige wurde erfolgreich aktualisiert.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating obituary:", error);
      toast({
        title: "Fehler",
        description: "Die Traueranzeige konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Möchten Sie diese Traueranzeige wirklich löschen?")) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("obituaries")
        .delete()
        .eq("id", obituary.id);

      if (error) throw error;

      toast({
        title: "Gelöscht",
        description: "Die Traueranzeige wurde entfernt.",
      });

      onOpenChange(false);
      window.location.href = "/suche";
    } catch (error) {
      console.error("Error deleting obituary:", error);
      toast({
        title: "Fehler",
        description: "Die Traueranzeige konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traueranzeige bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Informationen dieser Traueranzeige.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Geburtsdatum</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="death_date">Sterbedatum *</Label>
              <Input
                id="death_date"
                type="date"
                value={formData.death_date}
                onChange={(e) => handleChange("death_date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="birth_location">Geburtsort</Label>
              <Input
                id="birth_location"
                value={formData.birth_location}
                onChange={(e) => handleChange("birth_location", e.target.value)}
                placeholder="z.B. Berlin"
              />
            </div>

            <div>
              <Label htmlFor="death_location">Sterbeort</Label>
              <Input
                id="death_location"
                value={formData.death_location}
                onChange={(e) => handleChange("death_location", e.target.value)}
                placeholder="z.B. München"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="location">Wohnort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="z.B. Hamburg"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="photo_url">Foto-URL</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => handleChange("photo_url", e.target.value)}
                placeholder="https://..."
              />
              {formData.photo_url && (
                <div className="mt-2">
                  <img
                    src={formData.photo_url}
                    alt="Vorschau"
                    className="w-20 h-24 object-cover rounded"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => handleChange("text", e.target.value)}
                rows={4}
                placeholder="Trauertext..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="mourners">Trauernde</Label>
              <Textarea
                id="mourners"
                value={formData.mourners}
                onChange={(e) => handleChange("mourners", e.target.value)}
                rows={2}
                placeholder="In stiller Trauer..."
              />
            </div>

            <div>
              <Label htmlFor="funeral_date">Beisetzungsdatum</Label>
              <Input
                id="funeral_date"
                type="date"
                value={formData.funeral_date}
                onChange={(e) => handleChange("funeral_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="funeral_time">Beisetzungszeit</Label>
              <Input
                id="funeral_time"
                type="time"
                value={formData.funeral_time}
                onChange={(e) => handleChange("funeral_time", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="funeral_location">Beisetzungsort</Label>
              <Input
                id="funeral_location"
                value={formData.funeral_location}
                onChange={(e) => handleChange("funeral_location", e.target.value)}
                placeholder="z.B. Friedhof Ohlsdorf"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="source">Quelle</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
                placeholder="z.B. Süddeutsche Zeitung"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Löschen
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditObituaryModal;
