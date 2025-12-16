import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface CandlesListProps {
  obituaryId: string;
}

const CandlesList = ({ obituaryId }: CandlesListProps) => {
  const { data: candles } = useQuery({
    queryKey: ["candles", obituaryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candles")
        .select("*")
        .eq("obituary_id", obituaryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (!candles || candles.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-serif text-lg font-medium text-foreground mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-amber-500" />
        {candles.length} {candles.length === 1 ? 'Kerze' : 'Kerzen'} angezündet
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {candles.map((candle) => (
          <div
            key={candle.id}
            className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Flame className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  {candle.lighter_name || "Anonym"}
                </p>
                {candle.message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {candle.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(candle.created_at), "d. MMMM yyyy", { locale: de })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandlesList;