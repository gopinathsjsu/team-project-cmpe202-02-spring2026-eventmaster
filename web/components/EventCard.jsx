import styles from "./EventCard.module.css";

export default function EventCard({ event }) {
  return (
    <article className={styles.card}>
      <div className={styles.banner}>
        <div className={styles.dateBox}>
          <span className={styles.dateMonth}>{event.date.month}</span>
          <span className={styles.dateDay}>{event.date.day}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tags}>
          <span
            className={`${styles.tag} ${
              event.availabilityTone === "success" ? styles.success : styles.warning
            }`}
          >
            {event.availability}
          </span>
          <span className={styles.tag}>{event.location}</span>
          <span className={styles.tag}>{event.price}</span>
        </div>

        <h3 className={styles.title}>{event.title}</h3>
      </div>
    </article>
  );
}
