import { TimelineEvent } from "@/types/admin";

interface Props {
  events: TimelineEvent[];
}

const ActivityTimeline = ({ events }: Props) => (
  <div className="space-y-2 relative pl-4 border-l-2 border-border">
    {events.map((event, i) => (
      <div key={i} className="flex items-start gap-3 relative">
        <div
          className={`absolute -left-[calc(1rem+5px)] w-2.5 h-2.5 rounded-full mt-1 ${
            event.type === "error"
              ? "bg-destructive"
              : event.type === "warning"
              ? "bg-warning"
              : event.type === "score"
              ? "bg-primary"
              : "bg-muted-foreground"
          }`}
        />
        <span className="font-mono text-xs text-muted-foreground min-w-[3rem]">
          {event.time}
        </span>
        <span
          className={`text-xs ${
            event.type === "error"
              ? "text-destructive"
              : event.type === "warning"
              ? "text-warning"
              : event.type === "score"
              ? "text-primary"
              : "text-secondary-foreground"
          }`}
        >
          {event.event}
        </span>
      </div>
    ))}
  </div>
);

export default ActivityTimeline;
