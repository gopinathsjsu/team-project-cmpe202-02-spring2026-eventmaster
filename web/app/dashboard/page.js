import Link from "next/link";
import EventCard from "../../components/EventCard";
import SearchBar from "../../components/SearchBar";
import SkeletonCard from "../../components/SkeletonCard";
import SidePanel from "../../components/SidePanel";
import { sampleEvents } from "../../lib/sampleEvents";
import RequireAuth from "../components/RequireAuth";
import styles from "./page.module.css";

const upcomingItems = Array.from({ length: 8 });

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className={styles.dashboardLayout}>
        <SidePanel />

        <main className={styles.content}>
          <SearchBar />

          <section>
            <h1 className={styles.sectionTitle}>Recommended Events</h1>
            <div className={styles.recommendedGrid}>
              {sampleEvents.map((event) => (
                <Link
                  key={event.id ?? event.title}
                  href={`/event?id=${event.id}`}
                  className={styles.eventCardLink}
                >
                  <EventCard event={event} />
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.upcomingSection}>
            <div className={styles.upcomingHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <button className={styles.viewAllButton}>View All</button>
            </div>

            <div className={styles.upcomingGrid}>
              {upcomingItems.map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
