import Link from "next/link";
import React from "react";

export function PhaseNotice({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 630,
        padding: "48px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div className="ig-empty-card">
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: "rgb(var(--ig-secondary-background))",
            color: "rgb(var(--ig-colors-button-primary-link-text))",
          }}
        >
          {phase}
        </span>
        <h1 className="ig-empty-title">{title}</h1>
        <p className="ig-empty-subtitle">{description}</p>
        <Link className="ig-btn-primary" href="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
