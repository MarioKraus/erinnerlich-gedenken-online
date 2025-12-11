import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="font-serif text-xl font-semibold text-foreground">
              Erinnerlich
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
              Ein Ort der Erinnerung und des Gedenkens. Wir begleiten Sie in Zeiten 
              der Trauer mit Würde und Respekt.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/suche" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Traueranzeigen suchen
                </Link>
              </li>
              <li>
                <Link to="/anzeige-erstellen" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Anzeige aufgeben
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              Rechtliches
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Erinnerlich. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
