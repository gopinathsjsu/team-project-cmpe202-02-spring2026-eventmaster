"use client";

import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import RequireAuth from "../components/RequireAuth";
import RequireOrganizer from "../components/RequireOrganizer";
import styles from "./page.module.css";

export default function RsvpTrackingPage() {
  return (
    <RequireAuth>
      <RequireOrganizer>
        <div className={styles.shell}>
          <SidePanel />

          <main className={styles.content}>
            <SearchBar
              eventPlaceholder="Search your events..."
              locationPlaceholder="Filter by location..."
            />

            <header className={styles.headerSection}>
              <h1 className={styles.title}>RSVP tracking</h1>
              <p className={styles.subtitle}>
                See registration counts and RSVP status for events you organize. Wire this view to your
                registrations API when it is available.
              </p>
            </header>

            <div className={styles.placeholderCard}>
              No live RSVP data yet — connect the backend list of registrations per event to populate this
              page.
            </div>
          </main>
        </div>
      </RequireOrganizer>
    </RequireAuth>
  );
}
