import type { ReactNode } from "react";

/** Shared readable container for legal/policy pages (Privacy, Terms, Deletion). */
export function LegalDoc({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Legal</p>
      <h1 className="mt-2 text-4xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">Last updated: {updated}</p>
      {intro ? <p className="mt-6 text-lg leading-relaxed text-ink-2">{intro}</p> : null}
      <div
        className="mt-8 space-y-4 leading-relaxed text-ink-2
          [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink
          [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink
          [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6
          [&_a]:text-brand [&_a]:underline"
      >
        {children}
      </div>
    </main>
  );
}
