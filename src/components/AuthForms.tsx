"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { InstagramWordmark } from "./icons/InstagramIcons";

function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className={`ig-floating-field ${value.length > 0 ? "has-value" : ""}`}>
      <label className="ig-floating-label" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="ig-floating-input"
        id={id}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        value={value}
      />
    </div>
  );
}

export function LoginView() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = identifier.trim().length > 0 && password.length >= 6 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to log in.");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="ig-auth-page">
      <div className="ig-auth-card">
        <InstagramWordmark height={44} width={175} />

        <form className="ig-auth-form" onSubmit={handleSubmit}>
          <FloatingInput
            autoComplete="username"
            id="login-identifier"
            label="Username or email"
            onChange={setIdentifier}
            value={identifier}
          />
          <FloatingInput
            autoComplete="current-password"
            id="login-password"
            label="Password"
            onChange={setPassword}
            type="password"
            value={password}
          />

          <button
            className="ig-btn-primary"
            disabled={!canSubmit}
            style={{ width: "100%", marginTop: 8 }}
            type="submit"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>

          {error && <p className="ig-auth-error">{error}</p>}
        </form>
      </div>

      <div className="ig-auth-secondary-card">
        Don&apos;t have an account?{" "}
        <Link
          href="/accounts/emailsignup/"
          style={{
            color: "rgb(var(--ig-colors-button-primary-link-text))",
            fontWeight: 600,
          }}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

export function SignupView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create account.");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="ig-auth-page">
      <div className="ig-auth-card">
        <InstagramWordmark height={44} width={175} />
        <p
          style={{
            margin: "14px 0 0",
            textAlign: "center",
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "20px",
            color: "rgb(var(--ig-secondary-text))",
          }}
        >
          Sign up to see photos from your friends.
        </p>

        <form className="ig-auth-form" onSubmit={handleSubmit}>
          <FloatingInput
            autoComplete="email"
            id="signup-email"
            label="Email"
            onChange={setEmail}
            type="email"
            value={email}
          />
          <FloatingInput
            autoComplete="name"
            id="signup-fullname"
            label="Full Name"
            onChange={setFullName}
            value={fullName}
          />
          <FloatingInput
            autoComplete="username"
            id="signup-username"
            label="Username"
            onChange={setUsername}
            value={username}
          />
          <FloatingInput
            autoComplete="new-password"
            id="signup-password"
            label="Password"
            onChange={setPassword}
            type="password"
            value={password}
          />

          <button
            className="ig-btn-primary"
            disabled={!canSubmit}
            style={{ width: "100%", marginTop: 8 }}
            type="submit"
          >
            {submitting ? "Signing up..." : "Sign up"}
          </button>

          {error && <p className="ig-auth-error">{error}</p>}
        </form>
      </div>

      <div className="ig-auth-secondary-card">
        Have an account?{" "}
        <Link
          href="/accounts/login/"
          style={{
            color: "rgb(var(--ig-colors-button-primary-link-text))",
            fontWeight: 600,
          }}
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
