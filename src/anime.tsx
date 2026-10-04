import { DestinationCard } from "../components/ui/card-21";

const favorites = [
  { location: "Boku no Hero Academia", imageUrl: "assets/anime/my-hero-academia-hd.jpg", imageAlt: "Boku no Hero Academia anime poster", stats: "Action · Superheroes", href: "https://en.wikipedia.org/wiki/My_Hero_Academia", themeColor: "153 52% 19%" },
  { location: "Neon Genesis Evangelion", imageUrl: "assets/anime/evangelion-hd.jpg", imageAlt: "Neon Genesis Evangelion anime poster", stats: "Mecha · Psychological drama", href: "https://en.wikipedia.org/wiki/Neon_Genesis_Evangelion", themeColor: "266 45% 23%" },
  { location: "Death Note", imageUrl: "assets/anime/death-note-hd.jpg", imageAlt: "Death Note anime poster", stats: "Mystery · Psychological thriller", href: "https://en.wikipedia.org/wiki/Death_Note", themeColor: "352 50% 18%" },
  { location: "Fate series", imageUrl: "assets/anime/fate-ubw.jpg", imageAlt: "Fate/stay night: Unlimited Blade Works official key visual", stats: "Fantasy · Unlimited Blade Works", href: "https://en.wikipedia.org/wiki/Fate/stay_night", themeColor: "22 62% 20%" },
];

export function AnimeFavorites() {
  return <ol className="anime-grid">{favorites.map((anime, index) => (
    <li key={anime.location}><DestinationCard {...anime} rank={String(index + 1).padStart(2, "0")} /></li>
  ))}</ol>;
}
