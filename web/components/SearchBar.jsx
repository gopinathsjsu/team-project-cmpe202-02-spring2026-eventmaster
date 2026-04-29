"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getStoredUser } from "../lib/auth";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  eventPlaceholder = "Search an event...",
  locationPlaceholder = "Search a location...",
  profileLabel = "johnnyapples@gmail.com",
  onSignOut,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProfileLabel, setCurrentProfileLabel] = useState(profileLabel);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setCurrentProfileLabel(user.email || user.username || profileLabel);
  }, [profileLabel]);

  async function handleSignOut() {
    setIsMenuOpen(false);

    try {
      clearAuthTokens();
      if (onSignOut) {
        await onSignOut();
      }
    } catch (error) {
      console.error("Sign out handler failed:", error);
    } finally {
      router.replace("/login");
    }
  }

  function handleAccountSettings() {
    setIsMenuOpen(false);
    router.push("/settings");
  }

  return (
    <header className={styles.topBar}>
      <input className={styles.searchInput} placeholder={eventPlaceholder} />
      <input className={styles.searchInput} placeholder={locationPlaceholder} />
      <div className={styles.profileDropdown} ref={dropdownRef}>
        <button
          type="button"
          className={styles.profileButton}
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          <span className={styles.chevron}></span>
          {currentProfileLabel}
        </button>

        {isMenuOpen && (
          <div className={styles.dropdownMenu} role="menu" aria-label="Profile menu">
            <button
              type="button"
              className={`${styles.menuItem} ${styles.settingsItem}`}
              role="menuitem"
              onClick={handleAccountSettings}
            >
              <span className={styles.menuIcon}>o</span>
              Account Settings
            </button>
            <button type="button" className={styles.menuItem} role="menuitem" onClick={handleSignOut}>
              <span className={styles.menuIcon}>]</span>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
