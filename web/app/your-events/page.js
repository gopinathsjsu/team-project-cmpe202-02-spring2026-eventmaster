"use client";

import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import RequireAuth from "../components/RequireAuth";
import styles from "./page.module.css";

const yourEvents = [
  {
    id: 1,
    title: "Startup Seminar & Technical Convention 2026",
    location: "San Mateo, CA",
    startsAt: "Jun 29, 2026 · 9:00 AM",
    attendees: 182,
    status: "published",
  },
  {
    id: 2,
    title: "Silicon Valley Wine Tasting Night 2026",
    location: "Saratoga, CA",
    startsAt: "Apr 14, 2026 · 7:30 PM",
    attendees: 64,
    status: "published",
  },
  {
    id: 3,
    title: "AI Product Leadership Meetup",
    location: "San Jose, CA",
    startsAt: "May 12, 2026 · 6:00 PM",
    attendees: 0,
    status: "draft",
  },
];

const statusTone = {
  published: styles.published,
  draft: styles.draft,
  cancelled: styles.cancelled,
};

export default function YourEventsPage() {
  const publishedCount = yourEvents.filter((event) => event.status === "published").length;
  const draftCount = yourEvents.filter((event) => event.status === "draft").length;
  const totalAttendees = yourEvents.reduce((sum, event) => sum + event.attendees, 0);

  return (
    <RequireAuth>
      <div className={styles.yourEventsLayout}>
        <SidePanel />

        <main className={styles.content}>
          <SearchBar
            eventPlaceholder="Search your events..."
            locationPlaceholder="Search by location..."
          />

          <section className={styles.headerSection}>
            <h1 className={styles.title}>Your Events</h1>
            <p className={styles.subtitle}>
              Manage drafts, published listings, and your attendance totals.
            </p>
          </section>

          <section className={styles.statGrid}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Published Events</p>
              <p className={styles.statValue}>{publishedCount}</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Draft Events</p>
              <p className={styles.statValue}>{draftCount}</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Total Attendees</p>
              <p className={styles.statValue}>{totalAttendees}</p>
            </article>
          </section>

          <section className={styles.listSection}>
            <div className={styles.listHeader}>
              <h2 className={styles.listTitle}>Event Library</h2>
              <button type="button" className={styles.filterButton}>
                Filter by Status
              </button>
            </div>

            <div className={styles.eventList}>
              {yourEvents.map((event) => (
                <article key={event.id} className={styles.eventCard}>
                  <div className={styles.eventTopRow}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <span className={`${styles.statusPill} ${statusTone[event.status]}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className={styles.metaLine}>{event.location}</p>
                  <p className={styles.metaLine}>{event.startsAt}</p>
                  <p className={styles.metaLine}>Attendees: {event.attendees}</p>

                  <div className={styles.actions}>
                    <button type="button" className={styles.primaryButton}>
                      Manage Event
                    </button>
                    <button type="button" className={styles.secondaryButton}>
                      View Registrations
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
