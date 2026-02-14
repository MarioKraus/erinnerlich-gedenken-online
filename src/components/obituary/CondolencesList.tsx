import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface CondolencesListProps {
  obituaryId: string;
}

const CondolencesList = ({ obituaryId }: CondolencesListProps) => {
  const { data: condolences } = useQuery({
    queryKey: ["condolences", obituaryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condolences")
        .select("id, obituary_id, author_name, message, is_approved, created_at")
        .eq("obituary_id", obituaryId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (!condolences || condolences.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-serif text-lg font-medium text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-memorial-forest" />
        {condolences.length} {condolences.length === 1 ? 'Kondolenz' : 'Kondolenzen'}
      </h3>
      <div className="space-y-4">
        {condolences.map((condolence) => (
          <div
            key={condolence.id}
            className="p-4 bg-memorial-warm/30 border border-memorial-stone/20 rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {condolence.author_name}
                </p>
                <p className="text-foreground mt-2 whitespace-pre-line">
                  {condolence.message}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(condolence.created_at), "d. MMM yyyy", { locale: de })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondolencesList;