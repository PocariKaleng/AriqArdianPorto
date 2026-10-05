'use client';
import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SpecialText } from '@/components/ui/special-text';

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
function isLightTheme() { return document.documentElement.dataset.theme === 'light'; }
function serverTheme() { return false; }

export function BlogHeader({ basePath = '/', staticSite = false }: { basePath?: string; staticSite?: boolean } = {}) {
  const light = useSyncExternalStore(subscribeTheme, isLightTheme, serverTheme);
  return <><a className="skip" href="#main">Skip to content</a><header className="shell site-header"><div className="header-capsule">
    <a className="wordmark" href={`${basePath}index.html`} aria-label="Ariq Ardian home"><span>{staticSite ? 'Ariq Ardian' : <SpecialText speed={20} delay={.15}>Ariq Ardian</SpecialText>}</span></a>
    <nav aria-label="Main navigation"><a href={`${basePath}work.html`}>Work</a><a href={`${basePath}writeups.html`}>Write Up</a><a href={`${basePath}blog${staticSite ? '/' : ''}`} aria-current="page">Blog</a><a href={`${basePath}about.html`}>About</a></nav>
    <div className="header-actions"><button className="theme-toggle" aria-label={`Switch to ${light ? 'dark' : 'light'} mode`} onClick={() => {
      const next = isLightTheme() ? 'dark' : 'light'; document.documentElement.dataset.theme = next;
      try { localStorage.setItem('portfolio-theme', next); } catch { /* Theme still works without browser storage. */ }
    }}>{staticSite ? <span className="theme-icon" aria-hidden="true">☼</span> : light ? <Moon size={18} /> : <Sun size={18} />}</button><a className="contact-nav" href={`${basePath}contact.html`}><span className="contact-text">Contact</span></a></div>
  </div></header></>;
}
export function BlogFooter({ basePath = '/' }: { basePath?: string } = {}) {
  const profiles = [
    ['Email', 'mailto:artalarik2017@gmail.com', 'mail'],
    ['LinkedIn', 'https://www.linkedin.com/in/athalariiq-fildzahhanan-ardian-959790322/', 'linkedin'],
    ['GitHub', 'https://github.com/PocariKaleng', 'github'],
    ['Spotify', 'https://open.spotify.com/user/99geple0zr1mtp4lankelwh34', 'spotify'],
    ['Apple Music', 'https://music.apple.com/profile/ariqardian', 'applemusic'],
  ];
  return <footer id="footer" className="shell site-footer"><nav className="footer-socials" aria-label="Social profiles">{profiles.map(([name, href, icon]) => <a className="footer-social-link" key={name} href={href} title={name} aria-label={name} target={icon !== 'mail' ? '_blank' : undefined} rel="noopener noreferrer"><span className="footer-social-icon" style={{ '--footer-icon': `url(${basePath}assets/footer-${icon}.svg)` } as React.CSSProperties} aria-hidden="true" /></a>)}</nav><div className="footer-meta"><span>© {new Date().getFullYear()} Ariq Ardian</span><a href="#main">Back to top ↑</a></div></footer>;
}
