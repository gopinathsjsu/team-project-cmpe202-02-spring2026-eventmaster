'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "../login/login.styles.scss";

/** Remember Me: email + username only (never the password). */
const REMEMBER_STORAGE_KEY = "eventmaster_register_remember";

function readRememberedRegister() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REMEMBER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const email = typeof data?.email === "string" ? data.email : "";
    const username = typeof data?.username === "string" ? data.username : "";
    if (!email && !username) return null;
    return { email, username };
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = readRememberedRegister();
    if (saved) {
      setEmail(saved.email);
      setUsername(saved.username);
      setRemember(true);
    }
  }, []);

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const emailTrim = email.trim();
    const usernameTrim = username.trim();

    if (remember && (emailTrim || usernameTrim)) {
      localStorage.setItem(
        REMEMBER_STORAGE_KEY,
        JSON.stringify({ email: emailTrim, username: usernameTrim })
      );
    } else {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
    }

    const data = new FormData(e.currentTarget);
    console.log(Object.fromEntries(data));
  }

  return (
    <div className="loginRoot">
      <div className="loginBg" aria-hidden>
        <div className="loginBgBlob loginBgBlobTop" />
        <div className="loginBgBlob loginBgBlobBottom" />
      </div>

      <Navbar />

      <main className="loginMain">
        <div className="loginCard">
          <div className="loginBrandIcon">
            <img
              src="/assets/logo-alt.svg"
              alt=""
              className="loginBrandIconImg"
              width={64}
              height={64}
              aria-hidden
            />
          </div>
          <h1 className="loginTitle">Register for Eventmaster</h1>
          <p className="loginSubtitle">
            Let&apos;s fill out a few details, and we&apos;ll get you on your way to your next memorable experience.
          </p>

          <form className="loginForm" onSubmit={handleRegisterSubmit}>
            <div className="loginField">
              <label htmlFor="register-email" className="loginLabel">
                Email Address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                className="loginInput"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="loginField">
              <label htmlFor="register-username" className="loginLabel">
                Username
              </label>
              <input
                id="register-username"
                name="username"
                type="text"
                autoComplete="username"
                className="loginInput"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="loginField">
              <label htmlFor="register-password" className="loginLabel">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="loginInput"
                placeholder="Create a password"
              />
            </div>

            <div className="loginRow">
              <label className="loginRemember">
                <input
                  type="checkbox"
                  className="loginCheckbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember Me
              </label>
            </div>

            <button type="submit" className="loginSubmit">
              Register
            </button>
          </form>

          <p className="loginRegister">
            Already have an account?{" "}
            <Link href="/login" className="loginRegisterLink">
              Login
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
