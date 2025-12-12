import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";

interface SearchFormProps {
  variant?: "hero" | "compact";
  onSearch?: (params: { name: string; location: string; date: string; source: string }) => void;
}

const newspapers = [
  "Alle Tageszeitungen",
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

const SearchForm = ({ variant = "compact", onSearch }: SearchFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [name, setName] = useState(searchParams.get("name") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [source, setSource] = useState(searchParams.get("source") || "Alle Tageszeitungen");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (date) params.set("date", date);
    if (source && source !== "Alle Tageszeitungen") params.set("source", source);

    if (onSearch) {
      onSearch({ name, location: "", date, source });
    } else {
      navigate(`/suche?${params.toString()}`);
    }
  };

  if (variant === "hero") {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Tabs */}
        <Tabs defaultValue="traueranzeigen" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger 
              value="traueranzeigen" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-sm font-medium"
            >
              TRAUERANZEIGEN
            </TabsTrigger>
            <TabsTrigger 
              value="ratgeber" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-sm font-medium"
            >
              RATGEBER
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Name, Ort"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-background"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                placeholder="mm/dd/yyyy"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 bg-background pr-10"
              />
            </div>
            
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-11 bg-background">
                <SelectValue placeholder="Alle Tageszeitungen" />
              </SelectTrigger>
              <SelectContent>
                {newspapers.map((paper) => (
                  <SelectItem key={paper} value={paper}>
                    {paper}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="mt-4 gap-2" size="lg">
            <Search className="h-4 w-4" />
            Suchen
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Name, Ort"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10"
          />
        </div>
        
        <div className="relative flex-1">
          <Input
            type="date"
            placeholder="Datum"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10"
          />
        </div>
        
        <Button type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Suchen</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
