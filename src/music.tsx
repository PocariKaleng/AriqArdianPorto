import { createRoot } from "react-dom/client";
import { SpotifyCard, type Song } from "../components/ui/spotify-card";
import { AnimeFavorites } from "./anime";

const songs: Song[] = [
  { id: "2L9dBaAmQ5qydXHSz8bN96", title: "爆弾魔", subtitle: "Bakudanma", artists: "Yorushika", albumArt: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0228b535c92629e3c8d20ec242" },
  { id: "35KlorpQ6LQVVslvlcu1gN", title: "Lemon", subtitle: "レモン", artists: "Kenshi Yonezu", albumArt: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ae8ab64f32bde85afa89779d" },
  { id: "3FYWuYpw0KUTn1fP523jvx", title: "Matane Maboroshi", subtitle: "またね幻", artists: "ZUTOMAYO", albumArt: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e023366e2e8c1bc35c76267b5c8" },
  { id: "364JzOajs76bJymjHm3sVY", title: "Peace Sign", subtitle: "ピースサイン", artists: "Kenshi Yonezu", albumArt: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025ee78302fe48134795016cbf" },
];

const mount = document.getElementById("favorite-music");
if (mount) createRoot(mount).render(<SpotifyCard songs={songs} />);

const animeMount = document.getElementById("favorite-anime");
if (animeMount) createRoot(animeMount).render(<AnimeFavorites />);
