import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Plus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface SearchFilter {
  id: string;
  field: string;
  value: string;
  operator: "AND" | "OR";
}

export interface AdvancedSearchFormProps {
  onSearch: (filters: SearchFilter[]) => void;
  initialFilters?: SearchFilter[];
}

const FILTER_FIELDS = [
  { value: "nachname", label: "Nachname" },
  { value: "vorname", label: "Vorname" },
  { value: "ort", label: "Ort" },
  { value: "geburtsdatum", label: "Geburtsdatum" },
  { value: "sterbedatum", label: "Sterbedatum" },
  { value: "geburtsjahr", label: "Geburtsjahr" },
  { value: "sterbejahr", label: "Sterbejahr" },
  { value: "quelle", label: "Zeitungsquelle" },
];

const newspapers = [
  "Münchner Merkur",
  "Oberbayrisches Volksblatt",
  "Nürnberger Nachrichten",
  "Weser Kurier",
  "Kreiszeitung",
  "Westfälische Nachrichten",
  "Westfälischer Anzeiger",
  "Funke Mediengruppe NRW",
  "Rheinische Post",
  "Freie Presse",
  "Hersfelder Zeitung",
  "Offenbach Post",
  "HNA",
  "Waldeckische Landeszeitung",
  "Werra Rundschau",
  "Allgemeine Zeitung",
  "Trierischer Volksfreund",
  "Saarbrücker Zeitung",
  "Heilbronner Stimme",
  "Süddeutsche Zeitung",
  "Frankfurter Allgemeine",
  "Die Welt",
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const AdvancedSearchForm = ({ onSearch, initialFilters }: AdvancedSearchFormProps) => {
  const [filters, setFilters] = useState<SearchFilter[]>(
    initialFilters?.length ? initialFilters : [
      { id: generateId(), field: "nachname", value: "", operator: "AND" },
    ]
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Simple search state
  const [simpleSearch, setSimpleSearch] = useState("");

  const addFilter = useCallback(() => {
    setFilters((prev) => [
      ...prev,
      { id: generateId(), field: "nachname", value: "", operator: "AND" },
    ]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<SearchFilter>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAdvancedOpen) {
      // Advanced search mode
      const activeFilters = filters.filter((f) => f.value.trim() !== "");
      onSearch(activeFilters);
    } else {
      // Simple search mode - convert to filter format
      if (simpleSearch.trim()) {
        onSearch([
          { id: "simple", field: "name", value: simpleSearch.trim(), operator: "AND" }
        ]);
      } else {
        onSearch([]);
      }
    }
  };

  const clearFilters = () => {
    setFilters([{ id: generateId(), field: "nachname", value: "", operator: "AND" }]);
    setSimpleSearch("");
    onSearch([]);
  };

  const getPlaceholder = (field: string) => {
    switch (field) {
      case "nachname":
        return "z.B. Müller oder M* oder *mann";
      case "vorname":
        return "z.B. Mario oder Mar* oder *ia";
      case "ort":
        return "z.B. München oder Münch* oder *berg";
      case "geburtsdatum":
        return "TT.MM.JJJJ oder *.*.1950";
      case "sterbedatum":
        return "TT.MM.JJJJ oder *.01.2026";
      case "geburtsjahr":
        return "z.B. 1950 oder 195*";
      case "sterbejahr":
        return "z.B. 2026";
      case "quelle":
        return "Zeitung auswählen";
      default:
        return "";
    }
  };

  const renderFilterInput = (filter: SearchFilter) => {
    if (filter.field === "quelle") {
      return (
        <Select
          value={filter.value}
          onValueChange={(value) => updateFilter(filter.id, { value })}
        >
          <SelectTrigger className="h-10 bg-background flex-1">
            <SelectValue placeholder="Zeitung auswählen" />
          </SelectTrigger>
          <SelectContent>
            {newspapers.map((paper) => (
              <SelectItem key={paper} value={paper}>
                {paper}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (filter.field === "geburtsdatum" || filter.field === "sterbedatum") {
      return (
        <Input
          type="text"
          placeholder={getPlaceholder(filter.field)}
          value={filter.value}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          className="h-10 bg-background flex-1"
        />
      );
    }

    return (
      <Input
        type="text"
        placeholder={getPlaceholder(filter.field)}
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        className="h-10 bg-background flex-1"
      />
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Simple Search */}
        {!isAdvancedOpen && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Name oder Ort eingeben (* als Platzhalter)"
                  value={simpleSearch}
                  onChange={(e) => setSimpleSearch(e.target.value)}
                  className="h-11 bg-background"
                />
              </div>
              <Button type="submit" className="gap-2 h-11" size="lg">
                <Search className="h-4 w-4" />
                Suchen
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Search Toggle */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border"
            >
              {isAdvancedOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Einfache Suche
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Erweiterte Suche mit Filtern
                </>
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-6 pt-4 border-t border-border bg-muted/30">
              {/* Help Text */}
              <div className="mb-6 p-4 bg-memorial-warm rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Tipps zur Suche</p>
                    <ul className="space-y-1">
                      <li>• Verwenden Sie <code className="bg-muted px-1 rounded">*</code> als Platzhalter für beliebige Zeichen</li>
                      <li>• Beispiel: <code className="bg-muted px-1 rounded">M*</code> findet Müller, Meier, Meyer...</li>
                      <li>• Beispiel: <code className="bg-muted px-1 rounded">*berg</code> findet Heidelberg, Nürnberg...</li>
                      <li>• Verknüpfen Sie Filter mit UND (alle Bedingungen) oder ODER (eine der Bedingungen)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={filter.id} className="flex flex-wrap items-center gap-2">
                    {/* Operator (not for first filter) */}
                    {index > 0 && (
                      <Select
                        value={filter.operator}
                        onValueChange={(value: "AND" | "OR") =>
                          updateFilter(filter.id, { operator: value })
                        }
                      >
                        <SelectTrigger className="w-20 h-10 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">UND</SelectItem>
                          <SelectItem value="OR">ODER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {index === 0 && <div className="w-20 hidden sm:block" />}

                    {/* Field selector */}
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(filter.id, { field: value, value: "" })}
                    >
                      <SelectTrigger className="w-36 h-10 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value input */}
                    <div className="flex-1 min-w-[200px]">
                      {renderFilterInput(filter)}
                    </div>

                    {/* Remove button */}
                    {filters.length > 1 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFilter(filter.id)}
                              className="h-10 w-10 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Filter entfernen</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Filter Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFilter}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Filter hinzufügen
              </Button>

              {/* Search Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
                <Button type="submit" className="gap-2" size="lg">
                  <Search className="h-4 w-4" />
                  Suchen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </div>
  );
};

export default AdvancedSearchForm;
