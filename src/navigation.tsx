import { createRoot } from "react-dom/client";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { SpecialText } from "@/components/ui/special-text";

const wordmark = document.querySelector<HTMLElement>(".site-header .wordmark > span");
if (wordmark) {
  const name = wordmark.textContent?.trim() ?? "Ariq Ardian";
  createRoot(wordmark).render(<SpecialText speed={20} delay={.15}>{name}</SpecialText>);
}

const navigation = document.querySelector<HTMLElement>(".site-header nav");
if (navigation) {
  const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("a"));
  const tabs = links.map(link => ({ label: link.textContent?.trim() ?? "", href: link.getAttribute("href") ?? undefined }));
  const activeLabel = links.find(link => link.getAttribute("aria-current") === "page")?.textContent?.trim() ?? null;
  navigation.classList.add("animated-navigation");
  createRoot(navigation).render(<AnimatedTabs tabs={tabs} activeLabel={activeLabel} variant="underline" />);
}
