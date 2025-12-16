import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CandleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obituaryId: string;
  obituaryName: string;
  onSuccess: () => void;
}

const CandleModal = ({ open, onOpenChange, obituaryId, obituaryName, onSuccess }: CandleModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("candles")
        .insert({
          obituary_id: obituaryId,
          lighter_name: name || null,
          message: message || null,
        });

      if (error) throw error;

      toast({
        title: "Kerze angezündet",
        description: `Sie haben eine Kerze für ${obituaryName} angezündet.`,
      });

      setName("");
      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error lighting candle:", error);
      toast({
        title: "Fehler",
        description: "Die Kerze konnte nicht angezündet werden.",
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
            <Flame className="h-5 w-5 text-amber-500" />
            Kerze anzünden
          </DialogTitle>
          <DialogDescription>
            Zünden Sie eine virtuelle Kerze für {obituaryName} an.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="candle-name">Ihr Name (optional)</Label>
            <Input
              id="candle-name"
              placeholder="Anonym"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candle-message">Nachricht (optional)</Label>
            <Textarea
              id="candle-message"
              placeholder="Eine kurze Botschaft..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
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
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? "Wird angezündet..." : "Kerze anzünden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CandleModal;