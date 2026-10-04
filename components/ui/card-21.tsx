import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  imageAlt: string;
  location: string;
  stats: string;
  href: string;
  themeColor: string;
  rank: string;
}

// Poster-card adaptation of the supplied DestinationCard reference.
const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  ({ className, imageUrl, imageAlt, location, stats, href, themeColor, rank, style, ...props }, ref) => (
    <div ref={ref} className={cn("anime-destination", className)}
      style={{ "--theme-color": themeColor, ...style } as React.CSSProperties} {...props}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="anime-poster-card"
        aria-label={`Explore now: ${location} on Wikipedia (opens in a new tab)`}>
        <img className="anime-poster" src={imageUrl} alt={imageAlt} width="400" height="600" loading="lazy" decoding="async" />
        <div className="anime-poster-shade" aria-hidden="true" />
        <span className="anime-rank" aria-hidden="true">{rank}<span> / 04</span></span>
        <div className="anime-poster-content">
          <h3>{location}</h3>
          <p>{stats}</p>
          <span className="anime-explore"><span>Explore now</span><ArrowRight size={18} aria-hidden="true" /></span>
        </div>
      </a>
    </div>
  ),
);
DestinationCard.displayName = "DestinationCard";
export { DestinationCard };
