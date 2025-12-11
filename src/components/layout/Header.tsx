import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, User } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-semibold text-foreground tracking-tight">
            Erinnerlich
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/suche" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Traueranzeigen
          </Link>
          <Link 
            to="/anzeige-erstellen" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Anzeige aufgeben
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/suche">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
              <span className="sr-only">Suchen</span>
            </Button>
          </Link>
          <Link to="/anzeige-erstellen">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              <Plus className="h-4 w-4" />
              Anzeige aufgeben
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <User className="h-5 w-5" />
              <span className="sr-only">Anmelden</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
