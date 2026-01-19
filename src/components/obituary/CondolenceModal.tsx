import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CondolenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obituaryId: string;
  obituaryName: string;
  onSuccess: () => void;
}

const CondolenceModal = ({ open, onOpenChange, obituaryId, obituaryName, onSuccess }: CondolenceModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      toast({
        title: "Felder erforderlich",
        description: "Bitte geben Sie Ihren Namen und eine Nachricht ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-public-content", {
        body: {
          type: "condolence",
          data: {
            obituary_id: obituaryId,
            author_name: name.trim(),
            author_email: email || null,
            message: message.trim(),
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
        title: "Kondolenz eingereicht",
        description: "Ihre Anteilnahme wird nach Prüfung veröffentlicht.",
      });

      setName("");
      setEmail("");
      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error sending condolence:", error);
      toast({
        title: "Fehler",
        description: "Die Kondolenz konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <MessageSquare className="h-5 w-5 text-memorial-forest" />
            Kondolenz schreiben
          </DialogTitle>
          <DialogDescription>
            Drücken Sie Ihre Anteilnahme für {obituaryName} aus. Nach Prüfung wird Ihre Nachricht veröffentlicht.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condolence-name">Ihr Name *</Label>
            <Input
              id="condolence-name"
              placeholder="Ihr vollständiger Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condolence-email">E-Mail (optional)</Label>
            <Input
              id="condolence-email"
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condolence-message">Ihre Nachricht *</Label>
            <Textarea
              id="condolence-message"
              placeholder="Ihre Worte der Anteilnahme..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-memorial-forest hover:bg-memorial-forest/90"
            >
              {isSubmitting ? "Wird gesendet..." : "Kondolenz senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CondolenceModal;