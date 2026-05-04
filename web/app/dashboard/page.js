"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EventCard from "../../components/EventCard";
import SearchBar from "../../components/SearchBar";
import SkeletonCard from "../../components/SkeletonCard";
import SidePanel from "../../components/SidePanel";
import { fetchUpcomingEvents } from "../../lib/events";
import RequireAuth from "../components/RequireAuth";
import styles from "./page.module.css";

const RECOMMENDED_DISPLAY_LIMIT = 4;
const UPCOMING_DISPLAY_LIMIT = 8;
const SKELETON_PLACEHOLDERS = 8;

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setUpcomingLoading(true);
    setUpcomingError("");
    fetchUpcomingEvents()
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setUpcomingEvents(arr.slice(0, UPCOMING_DISPLAY_LIMIT));
      })
      .catch(() => {
        if (!cancelled) {
          setUpcomingError("Could not load upcoming events.");
          setUpcomingEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setUpcomingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RequireAuth>
      <div className={styles.dashboardLayout}>
        <SidePanel />

        <main className={styles.content}>
          <SearchBar />

          <section>
            <h1 className={styles.sectionTitle}>Recommended Events</h1>
            <div className={styles.recommendedGrid}>
              {upcomingLoading &&
                Array.from({ length: RECOMMENDED_DISPLAY_LIMIT }).map((_, index) => (
                  <SkeletonCard key={`rec-sk-${index}`} />
                ))}

              {!upcomingLoading &&
                upcomingEvents.slice(0, RECOMMENDED_DISPLAY_LIMIT).map((event) => (
                  <Link
                    key={event.id}
                    href={`/event?id=${event.id}`}
                    className={styles.eventCardLink}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}

              {!upcomingLoading && upcomingEvents.length === 0 && !upcomingError && (
                <p className={styles.upcomingInlineMessage}>
                  No published upcoming events to highlight yet.
                </p>
              )}
            </div>
          </section>

          <section className={styles.upcomingSection}>
            <div className={styles.upcomingHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <button type="button" className={styles.viewAllButton}>
                View All
              </button>
            </div>

            {upcomingError && (
              <p className={styles.upcomingInlineMessage} role="alert">
                {upcomingError}
              </p>
            )}

            <div className={styles.upcomingGrid}>
              {upcomingLoading &&
                Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
                  <SkeletonCard key={`sk-${index}`} />
                ))}

              {!upcomingLoading &&
                !upcomingError &&
                upcomingEvents.length === 0 && (
                  <p className={styles.upcomingInlineMessage}>
                    No upcoming published events yet. Publish an event with a future start time to see it
                    here.
                  </p>
                )}

              {!upcomingLoading &&
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/event?id=${event.id}`}
                    className={styles.eventCardLink}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
