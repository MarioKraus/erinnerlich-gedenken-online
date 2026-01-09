import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import bgNotFound from "@/assets/bg-notfound.jpg";
import { PAGE_COLORS } from "@/lib/colorVariations";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${bgNotFound})`,
          filter: `sepia(20%) hue-rotate(${PAGE_COLORS.notFound.hue - 140}deg) saturate(100%)`
        }}
      />
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(to bottom, hsla(${PAGE_COLORS.notFound.hue}, 15%, 20%, 0.5), hsla(${PAGE_COLORS.notFound.hue}, 12%, 15%, 0.4), hsla(${PAGE_COLORS.notFound.hue}, 10%, 12%, 0.6))`
        }}
      />
      
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
