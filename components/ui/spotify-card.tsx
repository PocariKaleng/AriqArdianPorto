"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Disc3, Music2 } from "lucide-react";

export interface Song {
  id: string;
  title: string;
  subtitle: string;
  artists: string;
  albumArt: string;
}

// Spotify owns playback and preview availability. No simulated playback timer.
export function SpotifyCard({ songs }: { songs: Song[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const song = songs[index];
  if (!song) return null;

  const select = (next: number) => {
    const normalized = (next + songs.length) % songs.length;
    if (normalized === index) return;
    setLoaded(false);
    setIndex(normalized);
  };

  return (
    <div className="music-card">
      <div className="music-card-top"><span><Music2 size={17} /> ARIQ’S PERSONAL PICKS</span><span>J-POP / {String(songs.length).padStart(2, "0")}</span></div>
      <div className="music-layout">
        <div className="music-feature">
          <div className="music-sleeve" key={song.id}>
            <div className="music-record" aria-hidden="true"><Disc3 /></div>
            <img src={song.albumArt} width="300" height="300" alt={`${song.title} — ${song.artists}, album cover`} loading="lazy" />
          </div>
          <div className="music-selected" aria-live="polite"><span className="music-kicker">SELECTED TRACK</span><h3>{song.title}</h3><p>{song.artists}</p></div>
          <div className="music-selection-controls">
            <a href={`https://open.spotify.com/track/${song.id}`} target="_blank" rel="noopener noreferrer">Open in Spotify <ArrowUpRight size={16} /></a>
            <div><button type="button" aria-label="Previous song" onClick={() => select(index - 1)}><ChevronLeft size={20} /></button><button type="button" aria-label="Next song" onClick={() => select(index + 1)}><ChevronRight size={20} /></button></div>
          </div>
        </div>
        <div className="music-queue">
          <div className="music-queue-heading"><h3>The rotation</h3><span>04 FAVORITES</span></div>
          <ol>{songs.map((track, n) => <li key={track.id}>
            <button type="button" className={`music-track${index === n ? " is-selected" : ""}`} aria-pressed={index === n} aria-label={`Select ${track.title} by ${track.artists}`} onClick={() => select(n)}>
              <span className="music-track-number">{String(n + 1).padStart(2, "0")}</span>
              <img src={track.albumArt} alt="" width="48" height="48" loading="lazy" />
              <span className="music-track-copy"><strong>{track.title}</strong><span>{track.artists}</span><small>{track.subtitle}</small></span>
              <span className="music-track-dot" aria-hidden="true" />
            </button>
          </li>)}</ol>
          <div className="music-listening-note"><span aria-hidden="true">♪</span><p>A few favorites, always worth another listen.</p></div>
        </div>
      </div>
      <div className="music-player">
        <div className="music-player-label"><span>LISTEN ON SPOTIFY</span><span>{loaded ? "Press play below" : "Connecting to Spotify…"}</span></div>
        <iframe key={song.id} src={`https://open.spotify.com/embed/track/${song.id}`} title={`Spotify player: ${song.title} by ${song.artists}`} width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager" onLoad={() => setLoaded(true)} />
        <p className="music-preview-note">Preview availability and the excerpt are selected by Spotify. If playback is unavailable, <a href={`https://open.spotify.com/track/${song.id}`} target="_blank" rel="noopener noreferrer">listen on Spotify ↗</a>.</p>
      </div>
    </div>
  );
}
