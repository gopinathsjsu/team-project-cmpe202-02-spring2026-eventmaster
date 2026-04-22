"use client";

import { useMemo, useState } from "react";
import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import styles from "./page.module.css";

function getPlaceholderSettings() {
  return {
    profile: {
      firstName: "Johnny",
      lastName: "Appleseed",
      email: "johnnyapples@gmail.com",
      phone: "(408) 555-0142",
      city: "San Jose",
      timezone: "America/Los_Angeles",
    },
    preferences: {
      language: "English",
      currency: "USD",
      marketingEmails: true,
      eventReminders: true,
    },
    security: {
      twoFactorEnabled: false,
    },
  };
}

function toBackendPayload(values) {
  // Keep this mapper isolated so backend field names can be changed in one place.
  return {
    first_name: values.profile.firstName,
    last_name: values.profile.lastName,
    email: values.profile.email,
    phone: values.profile.phone,
    city: values.profile.city,
    timezone: values.profile.timezone,
    language: values.preferences.language,
    currency: values.preferences.currency,
    marketing_emails: values.preferences.marketingEmails,
    event_reminders: values.preferences.eventReminders,
    two_factor_enabled: values.security.twoFactorEnabled,
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => getPlaceholderSettings());
  const [saveState, setSaveState] = useState("idle");

  const profileCompletion = useMemo(() => {
    const profileValues = Object.values(settings.profile);
    const completed = profileValues.filter((value) => String(value).trim().length > 0).length;
    return Math.round((completed / profileValues.length) * 100);
  }, [settings.profile]);

  function updateProfileField(field, value) {
    setSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }));
  }

  function updatePreferenceField(field, value) {
    setSettings((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [field]: value,
      },
    }));
  }

  function updateSecurityField(field, value) {
    setSettings((current) => ({
      ...current,
      security: {
        ...current.security,
        [field]: value,
      },
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState("saving");

    const payload = toBackendPayload(settings);
    console.log("Settings payload (placeholder):", payload);

    // Placeholder latency for now; replace with API call once backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaveState("saved");
  }

  return (
    <div className={styles.settingsLayout}>
      <SidePanel />

      <main className={styles.content}>
        <SearchBar />

        <section className={styles.headerSection}>
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Manage your profile, preferences, and security in one place.</p>
        </section>

        <form className={styles.form} onSubmit={handleSave}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Profile Information</h2>
            <p className={styles.cardDescription}>Keep your contact details up to date for event updates.</p>

            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>First name</span>
                <input
                  value={settings.profile.firstName}
                  onChange={(event) => updateProfileField("firstName", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Last name</span>
                <input
                  value={settings.profile.lastName}
                  onChange={(event) => updateProfileField("lastName", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Phone</span>
                <input
                  value={settings.profile.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>City</span>
                <input value={settings.profile.city} onChange={(event) => updateProfileField("city", event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Timezone</span>
                <select
                  value={settings.profile.timezone}
                  onChange={(event) => updateProfileField("timezone", event.target.value)}
                >
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/Denver">America/Denver</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </label>
            </div>

            <div className={styles.infoPill}>Profile completion: {profileCompletion}%</div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Preferences</h2>
            <p className={styles.cardDescription}>Customize how Eventmaster appears and communicates with you.</p>

            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>Language</span>
                <select
                  value={settings.preferences.language}
                  onChange={(event) => updatePreferenceField("language", event.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Currency</span>
                <select
                  value={settings.preferences.currency}
                  onChange={(event) => updatePreferenceField("currency", event.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={settings.preferences.marketingEmails}
                onChange={(event) => updatePreferenceField("marketingEmails", event.target.checked)}
              />
              <span>Receive marketing emails</span>
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={settings.preferences.eventReminders}
                onChange={(event) => updatePreferenceField("eventReminders", event.target.checked)}
              />
              <span>Receive event reminders</span>
            </label>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Security</h2>
            <p className={styles.cardDescription}>Add basic security controls to protect your account.</p>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={settings.security.twoFactorEnabled}
                onChange={(event) => updateSecurityField("twoFactorEnabled", event.target.checked)}
              />
              <span>Enable two-factor authentication</span>
            </label>
          </article>

          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Saving..." : "Save Changes"}
            </button>
            {saveState === "saved" && <p className={styles.savedMessage}>Changes saved locally (placeholder).</p>}
          </div>
        </form>
      </main>
    </div>
  );
}
