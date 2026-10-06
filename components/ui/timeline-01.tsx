import { Building2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TimelineItem = {
  id: string;
  title: string;
  company: string;
  period: string;
  date?: string;
  description?: string;
  tags?: string[];
  categories?: { label: string; period: string }[];
};

export default function Timeline({ items, label = "Experience timeline" }: { items: TimelineItem[]; label?: string }) {
  return (
    <ol className="about-timeline" role="list" aria-label={label}>
      {items.map(({ id, title, company, period, date, description, tags, categories }) => (
        <li key={id}>
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-company">
            <span className="timeline-company-icon" aria-hidden="true"><Building2 size={16} /></span>
            <span>{company}</span>
          </div>
          <h3>{title}</h3>
          <div className="timeline-period">
            <Calendar size={14} aria-hidden="true" />
            {date ? <time dateTime={date}>{period}</time> : <span>{period}</span>}
          </div>
          {description && <p className="timeline-description">{description}</p>}
          {!!tags?.length && <div className="timeline-tags">{tags.map(tag => <Badge variant="secondary" key={tag}>{tag}</Badge>)}</div>}
          {!!categories?.length && <div className="timeline-categories">{categories.map(category => <div className="timeline-category" key={category.label}><Badge variant="secondary">{category.label}</Badge>{categories.length > 1 && <span>{category.period}</span>}</div>)}</div>}
        </li>
      ))}
    </ol>
  );
}
