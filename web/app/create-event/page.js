"use client";

import { useState } from "react";
import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import RequireAuth from "../components/RequireAuth";
import styles from "./page.module.css";

function initialFormState() {
  return {
    title: "",
    location: "",
    startsAt: "",
    endsAt: "",
    capacity: "",
    description: "",
    status: "draft",
  };
}

export default function CreateEventPage() {
  const [form, setForm] = useState(() => initialFormState());
  const [saveState, setSaveState] = useState("idle");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateEvent(event) {
    event.preventDefault();
    setSaveState("saving");

    // Placeholder until events backend endpoints are ready.
    await new Promise((resolve) => setTimeout(resolve, 650));
    setSaveState("saved");
  }

  return (
    <RequireAuth>
      <div className={styles.createEventLayout}>
        <SidePanel />

        <main className={styles.content}>
          <SearchBar
            eventPlaceholder="Search your event drafts..."
            locationPlaceholder="Search event venues..."
          />

          <section className={styles.headerSection}>
            <h1 className={styles.title}>Create an Event</h1>
            <p className={styles.subtitle}>
              Draft your event details and publish when you are ready.
            </p>
          </section>

          <form className={styles.form} onSubmit={handleCreateEvent}>
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Event Details</h2>
              <p className={styles.cardDescription}>
                Add the core details attendees need before they register.
              </p>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>Event title</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Startup Seminar & Technical Convention 2026"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Location</span>
                  <input
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    placeholder="San Mateo, CA"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Start date and time</span>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) => updateField("startsAt", event.target.value)}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>End date and time</span>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) => updateField("endsAt", event.target.value)}
                    required
                  />
                </label>
              </div>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Capacity and Visibility</h2>
              <p className={styles.cardDescription}>
                Choose event limits and whether this event is still a draft.
              </p>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>Capacity</span>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) => updateField("capacity", event.target.value)}
                    placeholder="250"
                  />
                </label>

                <label className={styles.field}>
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Description</h2>
              <p className={styles.cardDescription}>
                Share the highlights, agenda, and what attendees should expect.
              </p>

              <label className={styles.field}>
                <span>Event description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Tell people what makes this event worth attending."
                  rows={6}
                />
              </label>
            </article>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={saveState === "saving"}>
                {saveState === "saving" ? "Saving Draft..." : "Save Event Draft"}
              </button>
              <button type="button" className={styles.secondaryButton}>
                Preview Event
              </button>
              {saveState === "saved" && (
                <p className={styles.savedMessage}>Draft saved locally (placeholder).</p>
              )}
            </div>
          </form>
        </main>
      </div>
    </RequireAuth>
  );
}
