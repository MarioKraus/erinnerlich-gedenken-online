import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import avatarForestBg from "@/assets/avatar-forest-bg.jpg";

export interface Obituary {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string;
  location: string | null;
  photo_url: string | null;
  text: string | null;
  source: string | null;
  created_at: string;
}

interface ObituaryCardProps {
  obituary: Obituary;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  // First and last name initials
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ObituaryCard = ({ obituary }: ObituaryCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: de });
    } catch {
      return dateString;
    }
  };

  const getLifeSpan = () => {
    const birth = obituary.birth_date ? new Date(obituary.birth_date).getFullYear() : null;
    const death = new Date(obituary.death_date).getFullYear();
    
    if (birth) {
      return `${birth} – ${death}`;
    }
    return `† ${death}`;
  };

  return (
    <Link 
      to={`/traueranzeige/${obituary.id}`}
      className="group block"
    >
      <article className="bg-card rounded-lg border border-border p-5 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30">
        <div className="flex gap-4">
          {obituary.photo_url ? (
            <div className="flex-shrink-0 w-20 h-24 rounded overflow-hidden bg-memorial-warm">
              <img 
                src={obituary.photo_url} 
                alt={obituary.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="flex-shrink-0 w-20 h-24 rounded overflow-hidden flex items-center justify-center relative"
              style={{ 
                backgroundImage: `url(${avatarForestBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <span className="relative font-serif text-2xl text-white drop-shadow-lg">
                {getInitials(obituary.name)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {obituary.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mt-1">
              {getLifeSpan()}
            </p>

            {obituary.location && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {obituary.location}
              </p>
            )}

            {obituary.text && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {obituary.text}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(obituary.death_date)}
          </span>
          {obituary.source && (
            <span className="text-xs text-memorial-stone bg-memorial-warm px-2 py-0.5 rounded">
              {obituary.source}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ObituaryCard;
