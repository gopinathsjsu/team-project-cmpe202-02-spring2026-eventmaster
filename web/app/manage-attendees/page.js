"use client";

import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import RequireAuth from "../components/RequireAuth";
import RequireOrganizer from "../components/RequireOrganizer";
import styles from "./page.module.css";

export default function ManageAttendeesPage() {
  return (
    <RequireAuth>
      <RequireOrganizer>
        <div className={styles.shell}>
          <SidePanel />

          <main className={styles.content}>
            <SearchBar
              eventPlaceholder="Search attendees..."
              locationPlaceholder="Filter by event location..."
            />

            <header className={styles.headerSection}>
              <h1 className={styles.title}>Manage attendees</h1>
              <p className={styles.subtitle}>
                View and manage people registered for your events. Connect this screen to your attendee /
                registration endpoints when they are ready.
              </p>
            </header>

            <div className={styles.placeholderCard}>
              No attendee records yet — backend wiring for registrations will fill this list.
            </div>
          </main>
        </div>
      </RequireOrganizer>
    </RequireAuth>
  );
}
