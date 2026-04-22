import EventCard from "../../components/EventCard";
import SearchBar from "../../components/SearchBar";
import SkeletonCard from "../../components/SkeletonCard";
import SidePanel from "../../components/SidePanel";
import styles from "./page.module.css";

const recommendedEvents = [
  {
    date: { month: "APR", day: "14" },
    availability: "Low Availability",
    availabilityTone: "warning",
    location: "Saratoga, CA",
    price: "From $89.99",
    title: "Silicon Valley Wine Tasting Night 2026",
  },
  {
    date: { month: "JUN", day: "29" },
    availability: "High Availability",
    availabilityTone: "success",
    location: "San Mateo, CA",
    price: "From $39.99",
    title: "Startup Seminar & Technical Convention 2026",
  },
];

const upcomingItems = Array.from({ length: 8 });

export default function DashboardPage() {
  return (
    <div className={styles.dashboardLayout}>
      <SidePanel />

      <main className={styles.content}>
        <SearchBar />

        <section>
          <h1 className={styles.sectionTitle}>Recommended Events</h1>
          <div className={styles.recommendedGrid}>
            {recommendedEvents.map((event) => (
              <EventCard key={event.title} event={event} />
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
  );
}
