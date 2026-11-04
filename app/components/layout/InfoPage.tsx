import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/** Khung chung cho các trang nội dung tĩnh (hướng dẫn, chính sách). */
export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="bg-cream px-5 pb-24 pt-32 sm:px-8">
        <article className="mx-auto max-w-[820px]">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {eyebrow}
          </span>
          <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-heading leading-tight">{title}</h1>
          <p className="mb-12 max-w-[640px] text-[15px] font-light leading-relaxed text-ink-soft">{intro}</p>
          <div className="flex flex-col gap-12">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-2xl leading-snug text-wine">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] font-light leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export function InfoTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded bg-paper shadow-[0_20px_40px_-20px_rgba(42,31,26,0.2)]">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wider text-ink-soft">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-ink/5 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`px-4 py-3 ${i === 0 ? "font-medium text-ink" : "text-ink-soft"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded border-l-2 border-gold bg-paper px-4 py-3 text-sm text-ink-soft">{children}</p>;
}
