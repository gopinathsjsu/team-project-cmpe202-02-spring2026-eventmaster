"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "../../lib/auth";
import { cancelEventRsvp, createEventRsvp, fetchEvent } from "../../lib/events";
import { buildGoogleCalendarUrl } from "../../lib/googleCalendar";
import styles from "./page.module.css";

const STATUS_BADGE = {
  published: styles.badgePublished,
  draft: styles.badgeDraft,
  pending_approval: styles.badgePending,
  cancelled: styles.badgeCancelled,
};

function formatStatus(status) {
  if (!status) return "";
  const labels = {
    draft: "Draft",
    published: "Published",
    pending_approval: "Pending approval",
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
  if (capacity == null) return "No limit set";
  return String(capacity);
}

function organizerSummary(event) {
  const id = event.organizer_id ?? event.organizer;
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

export default function EventDetailClient({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rsvpError, setRsvpError] = useState("");
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const load = useCallback(async () => {
    if (!eventId || Number.isNaN(Number(eventId))) {
      setEvent(null);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchEvent(eventId);
      setEvent(data);
    } catch (e) {
      setEvent(null);
      setError(e.message || "Could not load event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRsvp() {
    if (!event) return;
    setRsvpError("");
    setRsvpBusy(true);
    try {
      const updated = await createEventRsvp(event.id);
      setEvent(updated);
    } catch (e) {
      setRsvpError(e.message || "RSVP failed.");
    } finally {
      setRsvpBusy(false);
    }
  }

  async function handleCancelRsvp() {
    if (!event) return;
    setRsvpError("");
    setRsvpBusy(true);
    try {
      await cancelEventRsvp(event.id);
      await load();
    } catch (e) {
      setRsvpError(e.message || "Could not cancel RSVP.");
    } finally {
      setRsvpBusy(false);
    }
  }

  const missingId = !eventId || Number.isNaN(Number(eventId));

  if (missingId) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <Link href="/dashboard" className={styles.back}>
            ← Back to dashboard
          </Link>
          <div className={styles.notFound}>
            <h1>Choose an event</h1>
            <p>
              Open an event from the dashboard or upcoming list (for example{" "}
              <Link href="/dashboard">Browse upcoming events</Link>).
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <Link href="/dashboard" className={styles.back}>
            ← Back to dashboard
          </Link>
          <p className={styles.loadingText}>Loading event…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <Link href="/dashboard" className={styles.back}>
            ← Back to dashboard
          </Link>
          <div className={styles.notFound}>
            <h1>Event not found</h1>
            <p>{error || "No event matches that id."}</p>
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
  const onlineUrl = event.online_url?.trim() || "";
  const categoryName =
    event.category && typeof event.category === "object" && typeof event.category.name === "string"
      ? event.category.name.trim()
      : "";
  const isOrganizer = Boolean(user && Number(user.id) === Number(event.organizer_id));
  const isPublished = event.status === "published";
  const atCapacity =
    event.spots_remaining !== null &&
    event.spots_remaining !== undefined &&
    event.spots_remaining <= 0 &&
    !event.user_has_rsvp;

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
              {categoryName ? (
                <span className={styles.categoryBadge}>{categoryName}</span>
              ) : null}
              <span className={styles.eventId}>Event id · {event.id}</span>
            </div>
            <h1 className={styles.title}>{event.title}</h1>
          </div>
        </header>

        <section className={styles.rsvpCard} aria-label="RSVP">
          <p className={styles.sectionLabel}>Attend</p>
          {rsvpError ? <p className={styles.errorText}>{rsvpError}</p> : null}

          {!user ? (
            <p className={styles.rsvpBody}>
              <Link href="/login" className={styles.inlineLink}>
                Sign in
              </Link>{" "}
              to RSVP. Published events you join appear on{" "}
              <Link href="/calender" className={styles.inlineLink}>
                Your Calendar
              </Link>
              .
            </p>
          ) : null}

          {user && isOrganizer ? (
            <p className={styles.rsvpMuted}>You’re organizing this event.</p>
          ) : null}

          {user && !isOrganizer && isPublished && event.user_has_rsvp ? (
            <div className={styles.rsvpActions}>
              <p className={styles.rsvpSuccess}>You’re going.</p>
              <div className={styles.rsvpButtonRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={rsvpBusy}
                  onClick={handleCancelRsvp}
                >
                  {rsvpBusy ? "Updating…" : "Cancel RSVP"}
                </button>
                <Link href="/calender" className={styles.secondaryLink}>
                  View on Your Calendar
                </Link>
              </div>
            </div>
          ) : null}

          {user && !isOrganizer && isPublished && !event.user_has_rsvp ? (
            <div className={styles.rsvpActions}>
              {atCapacity ? (
                <p className={styles.rsvpMuted}>This event is at capacity.</p>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={rsvpBusy}
                  onClick={handleRsvp}
                >
                  {rsvpBusy ? "Saving…" : "RSVP"}
                </button>
              )}
              <p className={styles.rsvpHint}>
                After you RSVP, this event is listed on{" "}
                <Link href="/calender" className={styles.inlineLink}>
                  Your Calendar
                </Link>
                .
              </p>
            </div>
          ) : null}

          {user && !isOrganizer && !isPublished ? (
            <p className={styles.rsvpMuted}>RSVP opens when the event is published.</p>
          ) : null}

          {isPublished ? (
            <p className={styles.calendarAdd}>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  window.open(
                    buildGoogleCalendarUrl(event),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Add to Google Calendar
              </button>
              <span className={styles.rsvpMutedInline}>
                {" "}
                (opens Google — does not require RSVP)
              </span>
            </p>
          ) : null}
        </section>

        <section className={styles.detailCard} aria-label="Event details">
          <p className={styles.sectionLabel}>Details</p>
          <dl className={styles.dl}>
            <div>
              <dt className={styles.dt}>id</dt>
              <dd className={styles.dd}>{event.id}</dd>
            </div>
            <div>
              <dt className={styles.dt}>organizer</dt>
              <dd className={styles.dd}>{organizerSummary(event)}</dd>
            </div>
            <div>
              <dt className={styles.dt}>category</dt>
              <dd className={styles.dd}>{categoryName || "—"}</dd>
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
                <dd className={styles.ddMuted}>No description.</dd>
              )}
            </div>
            <div>
              <dt className={styles.dt}>location</dt>
              <dd className={styles.dd}>
                {event.location?.trim() ? event.location.trim() : "—"}
              </dd>
            </div>
            {onlineUrl ? (
              <div>
                <dt className={styles.dt}>online_url</dt>
                <dd className={styles.dd}>
                  <a
                    href={onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.inlineLink}
                  >
                    {onlineUrl}
                  </a>
                </dd>
              </div>
            ) : null}
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
            {"rsvp_count" in event ? (
              <div>
                <dt className={styles.dt}>RSVPs</dt>
                <dd className={styles.dd}>{event.rsvp_count}</dd>
              </div>
            ) : null}
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
