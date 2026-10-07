/** Analyse des champs « une ligne par élément » des formulaires d'administration. Pur et testable. */
const clean = (s: string) => s.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);

export const parseLines = (s: string, max = 40): string[] => clean(s).slice(0, max).map((l) => l.slice(0, 200));

/** « Catégorie | libellé » (la catégorie est facultative). */
export function parseFeatures(s: string, max = 60): { category: string; label: string }[] {
  return clean(s).slice(0, max).map((l) => {
    const i = l.indexOf("|");
    return i === -1 ? { category: "Général", label: l.slice(0, 200) } : { category: l.slice(0, i).trim().slice(0, 60) || "Général", label: l.slice(i + 1).trim().slice(0, 200) };
  }).filter((f) => f.label);
}

export type LinkParse = { ok: true; links: { label: string; url: string }[] } | { ok: false; error: string };

/** « Libellé | https://… » : seuls les liens https sont acceptés. */
export function parseLinks(s: string, max = 10): LinkParse {
  const links: { label: string; url: string }[] = [];
  for (const l of clean(s).slice(0, max)) {
    const i = l.indexOf("|");
    const label = (i === -1 ? "" : l.slice(0, i)).trim().slice(0, 80);
    const url = (i === -1 ? l : l.slice(i + 1)).trim();
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") throw new Error();
      links.push({ label: label || u.hostname, url: u.toString() });
    } catch { return { ok: false, error: `Lien invalide (https:// obligatoire) : ${l.slice(0, 60)}` }; }
  }
  return { ok: true, links };
}

export const featuresToText = (f: { category: string; label: string }[]) => f.map((x) => `${x.category} | ${x.label}`).join("\n");
export const linksToText = (l: { label: string; url: string }[]) => l.map((x) => `${x.label} | ${x.url}`).join("\n");
