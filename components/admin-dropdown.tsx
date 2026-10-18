"use client";

import type { ReactNode } from "react";

type AdminDropdownProps = {
  id: string;
  title: string;
  eyebrow: string;
  detail?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * Each admin area is independently collapsible. Keep children mounted while
 * hidden so an unfinished edit, filter or form is not lost on collapse.
 */
export function AdminDropdown({
  id, title, eyebrow, detail, open, onToggle, children,
}: AdminDropdownProps) {
  const contentId = id + "-content";

  return (
    <section className="admin-collapsible" id={id} aria-label={title}>
      <button
        type="button"
        className="admin-collapsible-trigger"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="admin-collapsible-label">
          <span className="admin-collapsible-eyebrow">{eyebrow}</span>
          <span className="admin-collapsible-title">{title}</span>
        </span>
        <span className="admin-collapsible-actions">
          {detail && <span className="admin-collapsible-detail">{detail}</span>}
          <svg
            className="admin-collapsible-chevron"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <div className="admin-collapsible-content" id={contentId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
