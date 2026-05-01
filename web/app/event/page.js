import Link from "next/link";
import { getSampleEventById } from "../../lib/sampleEvents";
import styles from "./page.module.css";

const STATUS_BADGE = {
  published: styles.badgePublished,
  draft: styles.badgeDraft,
  cancelled: styles.badgeCancelled,
};

function formatStatus(status) {
  if (!status) return "";
  const labels = {
    draft: "Draft",
    published: "Published",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatCapacity(capacity) {
  if (capacity == null) return "No limit set (null)";
  return String(capacity);
}

function organizerSummary(event) {
  const id = event.organizer;
  const name =
    event.organizer_username ??
    (typeof event.organizer === "object" && event.organizer?.username
      ? event.organizer.username
      : null);
  if (name != null && id != null) return `User #${id} (${name})`;
  if (name != null) return name;
  if (id != null) return `User #${id}`;
  return "—";
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const raw = sp?.id;
  const event =
    raw === undefined || raw === ""
      ? getSampleEventById(1)
      : getSampleEventById(Array.isArray(raw) ? raw[0] : raw);
  return {
    title: event?.title ?? "Event",
  };
}

export default async function EventDetailPage({ searchParams }) {
  const sp = await searchParams;
  const rawId = sp?.id;
  const requested =
    rawId === undefined || rawId === ""
      ? null
      : Array.isArray(rawId)
        ? rawId[0]
        : rawId;

  const event =
    requested === null ? getSampleEventById(1) : getSampleEventById(requested);
  const missingRequested = requested !== null && !event;

  if (missingRequested || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <Link href="/dashboard" className={styles.back}>
            ← Back to dashboard
          </Link>
          <div className={styles.notFound}>
            <h1>Event not found</h1>
            <p>
              No event matches that id. Try{" "}
              <Link href="/event?id=1">/event?id=1</Link> or{" "}
              <Link href="/event?id=2">/event?id=2</Link> for sample data.
            </p>
            <Link href="/dashboard" className={styles.back}>
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badgeClass = STATUS_BADGE[event.status] ?? styles.badgeDraft;
  const desc = event.description?.trim();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/dashboard" className={styles.back}>
          ← Back to dashboard
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.statusRow}>
              <span className={`${styles.badge} ${badgeClass}`}>
                {formatStatus(event.status)}
              </span>
              <span className={styles.eventId}>Event id · {event.id}</span>
            </div>
            <h1 className={styles.title}>{event.title}</h1>
          </div>
        </header>

        <section className={styles.detailCard} aria-label="Event record">
          <p className={styles.sectionLabel}>Event model fields</p>
          <dl className={styles.dl}>
            <div>
              <dt className={styles.dt}>id</dt>
              <dd className={styles.dd}>{event.id}</dd>
              <dd className={styles.ddMuted}>
                Primary key (implicit <code>BigAutoField</code> on the Django model).
              </dd>
            </div>
            <div>
              <dt className={styles.dt}>organizer</dt>
              <dd className={styles.dd}>{organizerSummary(event)}</dd>
              <dd className={styles.ddMuted}>
                ForeignKey to <code>AUTH_USER_MODEL</code>; cascade on delete.
              </dd>
            </div>
            <div>
              <dt className={styles.dt}>title</dt>
              <dd className={styles.dd}>{event.title}</dd>
            </div>
            <div>
              <dt className={styles.dt}>description</dt>
              {desc ? (
                <dd className={styles.ddBody}>{desc}</dd>
              ) : (
                <dd className={styles.ddMuted}>
                  Empty string (<code>blank=True</code>, <code>default=&quot;&quot;</code>).
                </dd>
              )}
            </div>
            <div>
              <dt className={styles.dt}>location</dt>
              <dd className={styles.dd}>
                {event.location?.trim() ? event.location.trim() : "— (blank)"}
              </dd>
            </div>
            <div>
              <dt className={styles.dt}>starts_at</dt>
              <dd className={styles.dd}>{formatDateTime(event.starts_at)}</dd>
            </div>
            <div>
              <dt className={styles.dt}>ends_at</dt>
              <dd className={styles.dd}>{formatDateTime(event.ends_at)}</dd>
            </div>
            <div>
              <dt className={styles.dt}>status</dt>
              <dd className={styles.dd}>{event.status}</dd>
            </div>
            <div>
              <dt className={styles.dt}>capacity</dt>
              <dd className={styles.dd}>{formatCapacity(event.capacity)}</dd>
            </div>
            <div>
              <dt className={styles.dt}>created_at</dt>
              <dd className={styles.dd}>{formatDateTime(event.created_at)}</dd>
            </div>
            <div>
              <dt className={styles.dt}>updated_at</dt>
              <dd className={styles.dd}>{formatDateTime(event.updated_at)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
