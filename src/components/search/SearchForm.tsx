import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar } from "lucide-react";

interface SearchFormProps {
  variant?: "hero" | "compact";
  onSearch?: (params: { name: string; location: string; date: string }) => void;
}

const SearchForm = ({ variant = "compact", onSearch }: SearchFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [name, setName] = useState(searchParams.get("name") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (location) params.set("location", location);
    if (date) params.set("date", date);

    if (onSearch) {
      onSearch({ name, location, date });
    } else {
      navigate(`/suche?${params.toString()}`);
    }
  };

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Name der verstorbenen Person"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ort"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Datum"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-4" size="lg">
            <Search className="h-4 w-4 mr-2" />
            Traueranzeigen suchen
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ort"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button type="submit">
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Suchen</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
