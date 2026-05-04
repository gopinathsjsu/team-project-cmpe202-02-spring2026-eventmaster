import styles from "./EventCard.module.css";

const STATUS_STYLES = {
  draft: styles.statusDraft,
  pending_approval: styles.statusDraft,
  published: styles.statusPublished,
  cancelled: styles.statusCancelled,
};

function formatDateBox(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { month: "—", day: "?" };
  }
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function formatSchedule(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  const datePart = start.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeFmt = { hour: "numeric", minute: "2-digit" };
  const startTime = start.toLocaleString("en-US", timeFmt);
  const endTime = end.toLocaleString("en-US", timeFmt);
  return `${datePart} · ${startTime} – ${endTime}`;
}

function formatStatus(status) {
  if (!status) return "";
  const map = {
    draft: "Draft",
    pending_approval: "Pending approval",
    published: "Published",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function organizerLabel(event) {
  if (event.organizer_username) return event.organizer_username;
  const o = event.organizer;
  if (o && typeof o === "object" && o.username) return o.username;
  return null;
}

function categoryLabel(event) {
  const c = event.category;
  if (c && typeof c === "object" && typeof c.name === "string") {
    const name = c.name.trim();
    return name || null;
  }
  return null;
}

export default function EventCard({ event }) {
  const { month, day } = formatDateBox(event.starts_at);
  const statusClass =
    STATUS_STYLES[event.status] ?? styles.statusDraft;
  const schedule = formatSchedule(event.starts_at, event.ends_at);
  const organizer = organizerLabel(event);
  const category = categoryLabel(event);
  const capacityText =
    event.capacity == null ? "No capacity limit" : `Max ${event.capacity} attendees`;

  return (
    <article className={styles.card}>
      <div className={styles.banner}>
        <div className={styles.dateBox}>
          <span className={styles.dateMonth}>{month}</span>
          <span className={styles.dateDay}>{day}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tags}>
          <span className={`${styles.tag} ${statusClass}`}>
            {formatStatus(event.status)}
          </span>
          {category ? (
            <span className={`${styles.tag} ${styles.tagCategory}`}>{category}</span>
          ) : null}
          {event.location?.trim() ? (
            <span className={styles.tag}>{event.location.trim()}</span>
          ) : null}
          <span className={styles.tag}>{capacityText}</span>
        </div>

        <h3 className={styles.title}>{event.title}</h3>

        {event.description?.trim() ? (
          <p className={styles.description}>{event.description.trim()}</p>
        ) : null}

        {schedule ? <p className={styles.schedule}>{schedule}</p> : null}

        {organizer ? (
          <p className={styles.organizer}>Organizer · {organizer}</p>
        ) : null}
      </div>
    </article>
  );
}
