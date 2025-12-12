import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="font-serif text-xl font-medium text-foreground tracking-tight">
            Erinnerlich
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link 
            to="/suche" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Traueranzeigen
          </Link>
          <Link 
            to="/anzeige-erstellen" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Anzeige aufgeben
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
