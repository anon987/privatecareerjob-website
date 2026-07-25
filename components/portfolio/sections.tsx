"use client";

import type { PublicSite, SiteEntry } from "@/lib/site";
import { groupSkills, parseLanguage, safeImg, yearsOfExperience } from "@/lib/site";
import type { ResolvedTheme } from "@/lib/themes";

export function Section({ id, title, t, children }: { id?: string; title: string; t: ResolvedTheme; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-6">
      <h2 className={`text-[13px] font-extrabold tracking-[2px] uppercase ${t.design.serifHeadings ? "font-serif" : ""}`} style={{ color: t.accent }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ---- Statistics (honest: derived from real content, or explicit site.stats) ---- */
export function Stats({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  const stats =
    site.stats?.length
      ? site.stats
      : ([
          yearsOfExperience(site) ? { value: `${yearsOfExperience(site)}+`, label: "Years experience" } : null,
          site.projects?.length ? { value: String(site.projects.length), label: site.projects.length === 1 ? "Project" : "Projects" } : null,
          site.certificates?.length ? { value: String(site.certificates.length), label: "Certifications" } : null,
          site.skills?.length >= 4 ? { value: String(site.skills.length), label: "Skills" } : null,
        ].filter(Boolean) as { value: string; label: string }[]);
  if (stats.length < 2) return null;
  return (
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.slice(0, 4).map((s) => (
        <div key={s.label} className={`rounded-2xl px-4 py-5 text-center ${t.card}`}>
          <div className="text-[26px] font-extrabold" style={{ color: t.accent }}>{s.value}</div>
          <div className={`text-[12.5px] font-semibold mt-0.5 ${t.soft}`}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Summary({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.summary) return null;
  return (
    <Section title="About" t={t}>
      <p className="text-[15.5px] leading-relaxed whitespace-pre-line opacity-90">{site.summary}</p>
    </Section>
  );
}

export function Skills({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.skills?.length) return null;
  const groups = groupSkills(site.skills);
  return (
    <Section title="Skills" t={t}>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.name || "all"}>
            {g.name && <h3 className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${t.faint}`}>{g.name}</h3>}
            <div className="flex flex-wrap gap-2">
              {g.skills.map((s) => (
                <span key={s} className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-semibold ${t.chip}`}>{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---- Experience: vertical timeline with accent dots ---- */
export function Timeline({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.experience?.length) return null;
  return (
    <Section title="Experience" t={t}>
      <ol className="relative">
        {site.experience.map((e, i) => (
          <li key={i} className={`relative pl-7 pb-7 last:pb-0 border-l-2 last:border-l-transparent ml-1 ${t.rule}`}>
            <span aria-hidden className="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2" style={{ background: t.accent, borderColor: t.dark ? "#14161D" : "#FDFDFC" }} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-[16.5px] font-bold">{e.role}</h3>
              {e.period && <span className={`text-[13px] whitespace-nowrap ${t.faint}`}>{e.period}</span>}
            </div>
            {e.company && <div className={`text-[14.5px] font-semibold mt-0.5 ${t.soft}`}>{e.company}</div>}
            {e.description && <p className={`text-[14.5px] leading-relaxed mt-1.5 ${t.soft}`}>{e.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---- Projects: rich cards; first project is featured ---- */
export function Projects({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.projects?.length) return null;
  return (
    <Section title="Projects" t={t}>
      <div className="grid gap-3 sm:grid-cols-2">
        {site.projects.map((p, i) => (
          <article key={i} className={`rounded-2xl p-5 ${t.card} ${i === 0 && site.projects.length > 1 ? "sm:col-span-2" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[16px] font-bold">{p.title || p.name}</h3>
              {i === 0 && site.projects.length > 1 && (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${t.chip}`}>Featured</span>
              )}
            </div>
            {p.description && <p className={`text-[14px] leading-relaxed mt-1.5 ${t.soft}`}>{p.description}</p>}
          </article>
        ))}
      </div>
    </Section>
  );
}

export function Achievements({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.achievements?.length) return null;
  return (
    <Section title="Achievements" t={t}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {site.achievements.map((a) => (
          <li key={a} className={`rounded-2xl px-4 py-3.5 text-[14.5px] font-semibold flex items-center gap-2.5 ${t.card}`}>
            <span aria-hidden style={{ color: t.accent }}>◆</span>
            {a}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function EntryList({ items, t }: { items: SiteEntry[]; t: ResolvedTheme }) {
  return (
    <div>
      {items.map((e, i) => (
        <div key={i} className={`py-4 first:pt-0 border-b last:border-b-0 ${t.rule}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <b className="text-[15.5px] font-bold">{e.degree || e.name || e.title || e.role}</b>
            {(e.period || e.year) && <span className={`text-[13px] whitespace-nowrap ${t.faint}`}>{e.period || e.year}</span>}
          </div>
          {(e.school || e.issuer || e.company) && <div className={`text-[14px] mt-0.5 ${t.soft}`}>{e.school || e.issuer || e.company}</div>}
          {e.description && <div className={`text-[14px] mt-1 ${t.soft}`}>{e.description}</div>}
        </div>
      ))}
    </div>
  );
}

export function Education({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.education?.length) return null;
  return (
    <Section title="Education" t={t}>
      <EntryList items={site.education} t={t} />
    </Section>
  );
}

export function Certificates({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.certificates?.length) return null;
  return (
    <Section title="Certificates" t={t}>
      <div className="grid gap-2 sm:grid-cols-2">
        {site.certificates.map((c, i) => (
          <div key={i} className={`rounded-2xl px-4 py-3.5 ${t.card}`}>
            <b className="text-[14.5px] font-bold">{c.name}</b>
            {(c.issuer || c.year) && <div className={`text-[13px] mt-0.5 ${t.soft}`}>{[c.issuer, c.year].filter(Boolean).join(" · ")}</div>}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Languages({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.languages?.length) return null;
  return (
    <Section title="Languages" t={t}>
      <div className="flex flex-wrap gap-2">
        {site.languages.map((l) => {
          const { name, level } = parseLanguage(l);
          return (
            <span key={l} className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-semibold ${t.chip}`}>
              {name}
              {level && <span className="opacity-65 font-medium">{` · ${level}`}</span>}
            </span>
          );
        })}
      </div>
    </Section>
  );
}

export function Testimonials({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.testimonials?.length) return null;
  return (
    <Section title="Testimonials" t={t}>
      <div className="grid gap-3 sm:grid-cols-2">
        {site.testimonials.map((x, i) => (
          <figure key={i} className={`rounded-2xl p-5 ${t.card}`}>
            <blockquote className="text-[14.5px] leading-relaxed italic opacity-90">“{x.quote}”</blockquote>
            <figcaption className={`mt-3 text-[13px] font-bold ${t.soft}`}>
              {x.author}
              {x.role && <span className="font-medium opacity-70">{` · ${x.role}`}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function Products({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.products?.length) return null;
  return (
    <Section title="Featured products" t={t}>
      <div className="grid gap-3 sm:grid-cols-2">
        {site.products.map((p) => (
          <article key={p.name} className={`rounded-2xl p-5 ${t.card}`}>
            {safeImg(p.image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeImg(p.image)} alt={p.name} loading="lazy" className="w-full aspect-video object-cover rounded-xl mb-3" />
            )}
            <h3 className="text-[16px] font-bold">{p.name}</h3>
            {p.description && <p className={`text-[14px] leading-relaxed mt-1.5 ${t.soft}`}>{p.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full text-[13px] font-bold text-white" style={{ background: t.accent }}>
                  Visit
                </a>
              )}
              {p.playUrl && (
                <a href={p.playUrl} target="_blank" rel="noopener noreferrer" className={`px-4 py-1.5 rounded-full text-[13px] font-bold border ${t.rule}`}>
                  Google Play
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function Gallery({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  const gallery = (site.gallery ?? []).map(safeImg).filter(Boolean);
  if (!gallery.length) return null;
  return (
    <Section title="Gallery" t={t}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {gallery.map((g, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={g} alt={`${site.name} — photo ${i + 1}`} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-2xl" />
        ))}
      </div>
    </Section>
  );
}

export function Contact({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  const url = `https://privatecareerjob.com/@${site.handle}`;
  const shareText = encodeURIComponent(`${site.name} — ${site.headline}. ${url}`);
  const btn = `inline-flex items-center min-h-11 px-5 rounded-full text-[14px] font-bold border transition-colors ${t.rule} hover:bg-[var(--pa-soft)]`;
  return (
    <Section id="contact" title="Contact" t={t}>
      <div className={`rounded-2xl p-6 text-center ${t.card}`}>
        <p className="text-[15.5px] font-bold">Interested in working with {site.name?.split(" ")[0] || "me"}?</p>
        <p className={`text-[13.5px] mt-1 ${t.soft}`}>
          {site.email || site.phone ? "Reach out directly, or share this profile with your team." : "Share this profile with your team, or connect on privatecareerjob."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {site.email && (
            <a href={`mailto:${site.email}?subject=Opportunity via privatecareerjob`} className="inline-flex items-center min-h-11 px-6 rounded-full text-[14px] font-bold text-white" style={{ background: t.accent }}>
              ✉️ Email
            </a>
          )}
          {site.phone && (
            <>
              <a href={`tel:${site.phone}`} className={btn}>📞 Call</a>
              <a href={`https://wa.me/${site.phone.replace(/[^0-9]/g, "")}?text=${shareText}`} target="_blank" rel="noopener noreferrer" className={btn}>WhatsApp</a>
            </>
          )}
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={btn}>Share on LinkedIn</a>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer" className={btn}>Share on X</a>
        </div>
      </div>
    </Section>
  );
}

export function Footer({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  return (
    <footer className={`mt-14 pt-8 pb-6 text-center text-[13px] border-t ${t.rule} ${t.soft}`}>
      <p className="font-semibold">privatecareerjob.com/@{site.handle}</p>
      <p className="mt-1 opacity-80">Created with privatecareerjob — India&apos;s premium job platform.</p>
      <a href="/signup" className="inline-block mt-3 font-bold" style={{ color: t.accent }}>
        Create your own portfolio — free
      </a>
    </footer>
  );
}

/** Mobile sticky CTA bar (hidden on desktop; hidden entirely when there's no contact). */
export function StickyBar({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  if (!site.email && !site.phone) return null;
  return (
    <div className={`fixed bottom-0 inset-x-0 sm:hidden border-t px-4 py-3 flex gap-2.5 ${t.rule} ${t.dark ? "bg-[#14161D]/95" : "bg-white/95"} backdrop-blur`}>
      {site.email ? (
        <a href={`mailto:${site.email}?subject=Opportunity via privatecareerjob`} className="flex-1 inline-flex items-center justify-center min-h-12 rounded-full text-[15px] font-bold text-white" style={{ background: t.accent }}>
          Hire me
        </a>
      ) : (
        <a href={`tel:${site.phone}`} className="flex-1 inline-flex items-center justify-center min-h-12 rounded-full text-[15px] font-bold text-white" style={{ background: t.accent }}>
          Call
        </a>
      )}
      <a href="#contact" className={`inline-flex items-center justify-center min-h-12 px-6 rounded-full text-[15px] font-bold border ${t.rule}`}>
        Contact
      </a>
    </div>
  );
}
