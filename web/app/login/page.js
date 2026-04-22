'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "./login.styles.scss";

/** Remember Me: only the username/email is stored (never the password). */
const REMEMBER_STORAGE_KEY = "eventmaster_login_remember";

function readRememberedEmail() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REMEMBER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return typeof data?.email === "string" ? data.email : null;
  } catch {
    return null;
  }
}
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = readRememberedEmail();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  function handleLoginSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();

    if (remember && trimmed) {
      localStorage.setItem(
        REMEMBER_STORAGE_KEY,
        JSON.stringify({ email: trimmed })
      );
    } else {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
    }

    const data = new FormData(e.currentTarget);
    console.log(Object.fromEntries(data));

    // Temporary navigation until backend authentication is implemented.
    window.location.assign("/dashboard");
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
          <h1 className="loginTitle">Welcome to Eventmaster</h1>
          <p className="loginSubtitle">
            Purchase your entry to your next experience, hassle free. Let&apos;s fill out your details and get you on track.
          </p>

          <form className="loginForm" onSubmit={handleLoginSubmit}>
            <div className="loginField">
              <label htmlFor="login-email" className="loginLabel">
                Email Address / Username
              </label>
              <input
                id="login-email"
                name="email"
                type="text"
                autoComplete="username"
                className="loginInput"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="loginField">
              <label htmlFor="login-password" className="loginLabel">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="loginInput"
                placeholder="Enter your password"
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
              <button type="button" className="loginForgot">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="loginSubmit">
              Sign In
            </button>
          </form>

          <p className="loginRegister">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="loginRegisterLink">
              Register
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
