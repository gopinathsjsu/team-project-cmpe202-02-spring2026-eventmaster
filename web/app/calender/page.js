"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "../../components/SearchBar";
import SidePanel from "../../components/SidePanel";
import { sampleEvents } from "../../lib/sampleEvents";
import RequireAuth from "../components/RequireAuth";
import styles from "./page.module.css";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CALENDAR_EMBED_URL =
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL || "";
const SAVED_EVENTS_KEY = "eventmaster_saved_events";
const GOOGLE_TOKEN_KEY = "eventmaster_google_calendar_token";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toGoogleDate(isoDate) {
  return new Date(isoDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleEventUrl(event) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(event.starts_at)}/${toGoogleDate(event.ends_at)}`,
    details: event.description || "Saved from Eventmaster",
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function getGoogleApiErrorMessage(response) {
  try {
    const payload = await response.json();
    const message = payload?.error?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Ignore JSON parsing errors and return fallback message.
  }
  return "Could not add event to Google Calendar.";
}

function readStoredGoogleToken() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GOOGLE_TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.expires_at) return null;
    if (Date.now() >= Number(parsed.expires_at)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSavedEventIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function buildMonthDays(events) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const leadingEmpty = firstDay.getDay();

  const eventDays = new Set(
    events.map((event) => {
      const date = new Date(event.starts_at);
      return date.getDate();
    })
  );

  const cells = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push({ type: "empty", key: `empty-${i}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      hasEvent: eventDays.has(day),
      isToday: day === now.getDate(),
    });
  }

  return cells;
}

export default function CalendarPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);
  const [connectError, setConnectError] = useState("");
  const [syncState, setSyncState] = useState("idle");
  const [activeEventId, setActiveEventId] = useState(null);

  const savedEvents = useMemo(() => {
    const savedIds = readSavedEventIds();
    if (savedIds.length === 0) {
      return [...sampleEvents].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    }

    return sampleEvents
      .filter((event) => savedIds.includes(event.id))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, []);

  const calendarCells = useMemo(() => buildMonthDays(savedEvents), [savedEvents]);
  const upcomingCount = savedEvents.filter(
    (event) => new Date(event.starts_at).getTime() > Date.now()
  ).length;

  useEffect(() => {
    const storedToken = readStoredGoogleToken();
    if (storedToken) {
      setGoogleToken(storedToken);
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        callback: (response) => {
          if (response?.error || !response?.access_token) {
            setConnectError("Google authorization failed. Please try again.");
            return;
          }

          const expiresInMs = Number(response.expires_in || 3600) * 1000;
          const tokenPayload = {
            access_token: response.access_token,
            expires_at: Date.now() + expiresInMs,
          };
          localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify(tokenPayload));
          setGoogleToken(tokenPayload);
          setIsConnected(true);
          setConnectError("");
        },
      });
      setTokenClient(client);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.oauth2) return;
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        callback: (response) => {
          if (response?.error || !response?.access_token) {
            setConnectError("Google authorization failed. Please try again.");
            return;
          }

          const expiresInMs = Number(response.expires_in || 3600) * 1000;
          const tokenPayload = {
            access_token: response.access_token,
            expires_at: Date.now() + expiresInMs,
          };
          localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify(tokenPayload));
          setGoogleToken(tokenPayload);
          setIsConnected(true);
          setConnectError("");
        },
      });
      setTokenClient(client);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  function handleConnectGoogle() {
    setConnectError("");

    if (!GOOGLE_CLIENT_ID) {
      setConnectError("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Add it to your web environment.");
      return;
    }

    if (!tokenClient) {
      setConnectError("Google client is still loading. Try again in a moment.");
      return;
    }

    tokenClient.requestAccessToken({ prompt: "consent" });
  }

  function handleDisconnectGoogle() {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    setGoogleToken(null);
    setIsConnected(false);
    setConnectError("");
  }

  async function handleAddEventToGoogle(event) {
    if (!googleToken?.access_token) {
      setConnectError("Please connect Google Calendar first.");
      return;
    }

    setActiveEventId(event.id);
    setSyncState("syncing");
    setConnectError("");

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${googleToken.access_token}`,
        },
        body: JSON.stringify({
          summary: event.title,
          location: event.location,
          description: event.description || "Saved from Eventmaster",
          start: {
            dateTime: new Date(event.starts_at).toISOString(),
          },
          end: {
            dateTime: new Date(event.ends_at).toISOString(),
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleDisconnectGoogle();
          throw new Error("Google session expired. Please reconnect your calendar.");
        }
        const apiErrorMessage = await getGoogleApiErrorMessage(response);
        throw new Error(`Google Calendar rejected the request: ${apiErrorMessage}`);
      }

      setSyncState("success");
    } catch (error) {
      setSyncState("error");
      setConnectError(error.message || "Unable to sync with Google Calendar.");
    } finally {
      setActiveEventId(null);
    }
  }

  return (
    <RequireAuth>
      <div className={styles.calendarLayout}>
        <SidePanel />

        <main className={styles.content}>
          <SearchBar
            eventPlaceholder="Search saved events..."
            locationPlaceholder="Search event locations..."
          />

          <section className={styles.headerSection}>
            <h1 className={styles.title}>Your Calendar</h1>
            <p className={styles.subtitle}>
              Track saved events and sync them to Google Calendar.
            </p>
          </section>

          <section className={styles.statGrid}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Saved Events</p>
              <p className={styles.statValue}>{savedEvents.length}</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Upcoming This Year</p>
              <p className={styles.statValue}>{upcomingCount}</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Google Calendar</p>
              <p className={styles.statValue}>{isConnected ? "Connected" : "Not Connected"}</p>
            </article>
          </section>

          <section className={styles.integrationSection}>
            <div>
              <h2 className={styles.sectionTitle}>Google Calendar Integration</h2>
              <p className={styles.sectionText}>
                Connect your Google account and quickly add any saved event to your calendar.
              </p>
            </div>

            <div className={styles.integrationActions}>
              <button type="button" className={styles.primaryButton} onClick={handleConnectGoogle}>
                {isConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleDisconnectGoogle}
              >
                Disconnect
              </button>
            </div>
            {connectError && <p className={styles.errorText}>{connectError}</p>}
            {syncState === "success" && (
              <p className={styles.successText}>Event was added to your Google Calendar.</p>
            )}
          </section>

          <section className={styles.mainGrid}>
            <article className={styles.monthCard}>
              <div className={styles.monthHeader}>
                <h3 className={styles.monthTitle}>
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <p className={styles.legend}>
                  <span className={styles.legendDot} />
                  Days with saved events
                </p>
              </div>

              <div className={styles.weekdays}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                  <p key={label}>{label}</p>
                ))}
              </div>

              <div className={styles.dayGrid}>
                {calendarCells.map((cell) =>
                  cell.type === "empty" ? (
                    <div key={cell.key} className={styles.emptyCell} />
                  ) : (
                    <div
                      key={cell.key}
                      className={`${styles.dayCell} ${cell.hasEvent ? styles.dayWithEvent : ""} ${
                        cell.isToday ? styles.today : ""
                      }`}
                    >
                      {cell.day}
                    </div>
                  )
                )}
              </div>
            </article>

            <article className={styles.savedEventsCard}>
              <h3 className={styles.sectionTitle}>Saved Event List</h3>

              {savedEvents.length === 0 ? (
                <p className={styles.emptyState}>
                  You have no saved events yet. Save events from Browse Events to show them here.
                </p>
              ) : (
                <div className={styles.eventList}>
                  {savedEvents.map((event) => (
                    <article key={event.id} className={styles.eventItem}>
                      <div>
                        <p className={styles.eventTitle}>{event.title}</p>
                        <p className={styles.eventMeta}>
                          {formatDate(event.starts_at)} at {formatTime(event.starts_at)}
                        </p>
                        <p className={styles.eventMeta}>{event.location}</p>
                      </div>

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => {
                          if (isConnected) {
                            handleAddEventToGoogle(event);
                            return;
                          }

                          window.open(buildGoogleEventUrl(event), "_blank", "noopener,noreferrer");
                        }}
                      >
                        {activeEventId === event.id && syncState === "syncing"
                          ? "Syncing..."
                          : "Add to Google"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          {GOOGLE_CALENDAR_EMBED_URL && (
            <section className={styles.embedSection}>
              <h2 className={styles.sectionTitle}>Google Calendar Preview</h2>
              <iframe
                title="Google Calendar"
                src={GOOGLE_CALENDAR_EMBED_URL}
                className={styles.embed}
                loading="lazy"
              />
            </section>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
