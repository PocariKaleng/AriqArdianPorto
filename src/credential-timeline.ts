import type { TimelineItem } from "../components/ui/timeline-01";

type Credential = { title: string; meta: string; roleTitle: string; roleDate: string };
type Kind = "experience" | "community";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthDate(value: string, year?: string) {
  const match = value.match(/^([A-Za-z]{3})(?: (\d{4}))?$/);
  const month = match ? months.indexOf(match[1]) : -1;
  const resolvedYear = match?.[2] || year;
  return month >= 0 && resolvedYear ? `${resolvedYear}-${String(month + 1).padStart(2, "0")}` : "";
}

function monthLabel(date: string) {
  return `${months[Number(date.slice(5)) - 1]} ${date.slice(0, 4)}`;
}

export function credentialTimeline(entries: Credential[], kind: Kind): TimelineItem[] {
  const records = entries.flatMap(entry => [
    { title: entry.title, meta: entry.meta },
    ...(entry.roleTitle ? [{ title: entry.roleTitle, meta: entry.roleDate }] : []),
  ]).map(({ title, meta }) => {
    const metaSplit = meta.lastIndexOf(" · ");
    const titleSplit = title.lastIndexOf(" · ");
    const company = kind === "community" ? title.slice(titleSplit + 3) : meta.slice(0, metaSplit);
    const role = kind === "community" ? title.slice(0, titleSplit) : title;
    const period = metaSplit < 0 ? meta : meta.slice(metaSplit + 3);
    const [first, last = first] = period.split(" – ");
    const year = last.match(/\d{4}$/)?.[0];
    const start = monthDate(first, year), end = monthDate(last);
    const phase = role.match(/\s*\((Quals|Finals|FREEPASS)\)$/);
    const name = phase ? role.slice(0, phase.index) : role;
    const category = kind === "community" ? role.replace(/^Community /, "") : phase ? ({ Quals: "Qualifiers", Finals: "Finals", FREEPASS: "Freepass" }[phase[1]]) : "";
    return { company, title: name, period, start, end, ongoing: last === "Present", category, description: kind === "community" && metaSplit >= 0 ? meta.slice(0, metaSplit) : undefined };
  });

  const groups = new Map<string, typeof records>();
  for (const record of records) {
    const key = kind === "community" ? record.company : `${record.company}\u0000${record.title}`;
    const group = groups.get(key) || [];
    group.push(record);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([id, group]) => {
    group.sort((a, b) => a.start.localeCompare(b.start));
    const first = group[0], latest = group[group.length - 1];
    const end = group.map(entry => entry.end).sort().at(-1) || latest.start;
    const ongoing = group.some(entry => entry.ongoing);
    let period = first.period;
    if (group.length > 1) {
      period = ongoing ? `${monthLabel(first.start)} – Present` : first.start === end ? monthLabel(end) : first.start.slice(0, 4) === end.slice(0, 4) ? `${monthLabel(first.start).split(" ")[0]} – ${monthLabel(end)}` : `${monthLabel(first.start)} – ${monthLabel(end)}`;
    }
    return {
      id, company: first.company,
      title: kind === "community" && group.length > 1 ? "Community roles" : first.title,
      period, date: group.length === 1 && first.start === first.end ? first.start : undefined,
      description: first.description,
      categories: kind === "community" && group.length === 1 ? [] : group.filter(entry => entry.category).map(entry => ({ label: entry.category, period: entry.period })),
      sortDate: latest.start, ongoing,
    };
  }).sort((a, b) => kind === "community" && a.ongoing !== b.ongoing ? Number(b.ongoing) - Number(a.ongoing) : b.sortDate.localeCompare(a.sortDate));
}
