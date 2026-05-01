"use client";
import styles from "./SidePanel.module.css";
import { usePathname, useRouter } from "next/navigation";

const mainItems = [
  "Overview",
  "Create an Event",
  "Browse Events",
  "Your Events",
  "Your Calendar",
  "Orders",
  "Notifications",
];

const secondaryItems = ["Administration", "Support"];

export default function SidePanel() {
  const router = useRouter();
  const pathname = usePathname();

  const routesByLabel = {
    Overview: "/dashboard",
    "Create an Event": "/create-event",
    "Your Events": "/your-events",
    "Your Calendar": "/calender",
  };

  const handleNavigation = (label) => {
    const route = routesByLabel[label];
    if (!route) return;
    router.push(route);
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon}>
        </span>
        <span
          className={styles.brandName}
          onClick={() => router.push("/dashboard")}
        >
          Eventmaster
        </span>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>MAIN</p>
        {mainItems.map((item, index) => (
          // index is intentionally unused; kept for future ordering/styling needs
          <button
            key={item}
            className={`${styles.navItem} ${
              routesByLabel[item] && pathname === routesByLabel[item]
                ? styles.active
                : ""
            }`}
            onClick={() => handleNavigation(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>OTHERS</p>
        {secondaryItems.map((item) => (
          <button key={item} className={styles.navItem}>
            {item}
          </button>
        ))}
      </div>

      <button className={styles.organizerButton}>Become an Organizer</button>
      <button className={styles.helpButton}>Help &amp; Feedback</button>
    </aside>
  );
}
