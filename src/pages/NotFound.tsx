import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import bgNotFound from "@/assets/bg-notfound.jpg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgNotFound})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      
      <div className="relative z-10 text-center px-4">
        <h1 className="font-serif text-6xl md:text-8xl font-medium text-white mb-4 drop-shadow-lg">
          404
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
          Diese Seite wurde nicht gefunden
        </p>
        <Link to="/">
          <Button variant="secondary" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
