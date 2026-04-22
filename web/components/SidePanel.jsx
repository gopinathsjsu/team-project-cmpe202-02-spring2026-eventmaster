"use client";
import styles from "./SidePanel.module.css";
import { useRouter } from "next/navigation";

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
function handleNavigationHome() {
  router.push("/dashboard");
}
export default function SidePanel() {
  return (
    <aside className={styles.panel}>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon}>
        </span>
        <span className={styles.brandName} onClick={handleNavigationHome}>Eventmaster</span>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>MAIN</p>
        {mainItems.map((item, index) => (
          <button
            key={item}
            className={`${styles.navItem} ${index === 0 ? styles.active : ""}`}
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
