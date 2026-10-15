"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/visual/Icon";
import { cn } from "@/components/ui/cn";
import { QUESTIONS } from "@/lib/orientation/questions";
import { buildDiagnostic, validateAnswers, type Answers } from "@/lib/orientation/diagnostic";

const shell = "rounded-3xl bg-white p-6 shadow-[0_28px_60px_-30px_rgba(6,59,112,.45)] ring-1 ring-navy/5 sm:p-8";

/** Tuile de réponse : zone tactile ≥ 56 px, état coché visible sans dépendre de la seule couleur (pastille avec coche). */
function Choice({ type, name, label, checked, onChange }: { type: "radio" | "checkbox"; name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white px-4 text-[15px] font-medium transition-all active:scale-[.99]", checked ? "border-brand bg-brand-soft shadow-sm" : "border-navy/10 hover:border-brand/40")}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center border-2 text-white transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30", type === "radio" ? "rounded-full" : "rounded-md", checked ? "border-brand bg-brand" : "border-navy/30")}>
        {checked && <Icon name="check" className="size-4" strokeWidth={3.2} />}
      </span>
      {label}
    </label>
  );
}

export function Questionnaire() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const q = QUESTIONS[i];
  const value = answers[q.code];

  const set = (v: string | string[]) => { setAnswers((a) => ({ ...a, [q.code]: v })); setError(""); };
  const toggle = (opt: string) => {
    const cur = (value as string[] | undefined) ?? [];
    set(cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  function next() {
    const optional = q.code === "project";
    const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    if (empty && !optional) return setError("Choisissez une réponse pour continuer.");
    if (q.kind === "number") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 2026 || n > 2035) return setError("Indiquez une année entre 2026 et 2035.");
    }
    if (i < QUESTIONS.length - 1) return setI(i + 1);
    const errs = validateAnswers(answers, QUESTIONS);
    if (errs.length) return setError(errs[0]);
    setDone(true);
  }

  if (done) {
    const d = buildDiagnostic(answers);
    return (
      <div className="space-y-5" aria-live="polite">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] p-6 text-white shadow-[0_28px_60px_-30px_rgba(6,59,112,.7)] sm:p-8">
          <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-gold text-navy"><Icon name="cap" className="size-7" /></span>
          <h2 className="mt-4 font-display text-2xl font-extrabold">Votre profil</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {d.profile.map((p) => <div key={p.label} className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/20"><dt className="text-xs text-white/90">{p.label}</dt><dd className="font-display font-bold">{p.value}</dd></div>)}
          </dl>
        </section>

        <section className={shell}>
          <h2 className="font-display text-xl font-extrabold">Nous vous recommandons</h2>
          <p className="mt-1 text-sm text-navy/75">Votre profil correspond à plusieurs possibilités.</p>
          <ol className="mt-4 space-y-3">
            {d.recommendations.map((r, k) => <li key={r} className="flex items-start gap-3"><span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-extrabold text-brand">{k + 1}</span><span className="pt-0.5 text-[15px]">{r}</span></li>)}
          </ol>
          {d.notes.length > 0 && <ul className="mt-5 space-y-2 rounded-2xl bg-[#fff6e0] p-4 text-sm">{d.notes.map((n) => <li key={n} className="flex gap-2"><Icon name="clock" className="mt-0.5 size-4 shrink-0 text-[#8a6100]" />{n}</li>)}</ul>}
          <p className="mt-5 text-xs text-navy/75">Ce diagnostic est indicatif. Il ne garantit ni admission ni visa : la décision finale appartient aux établissements et aux autorités compétentes.</p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="cta" size="lg">Parler à un conseiller</ButtonLink>
          <ButtonLink href={`/packs/${d.suggestedPack}`} variant="outline" size="lg">Découvrir les packs</ButtonLink>
          <Button variant="ghost" size="lg" onClick={() => { setDone(false); setI(0); setAnswers({}); }}>Refaire le test</Button>
        </div>
        <p className="text-sm text-navy/75"><Link href="/inscription" className="font-semibold text-brand underline">Créez un compte</Link> pour suivre votre projet avec un conseiller.</p>
      </div>
    );
  }

  const pct = Math.round((i / QUESTIONS.length) * 100);
  return (
    <div className={shell}>
      <div className="flex items-center justify-between text-sm font-semibold"><span className="text-brand">Question {i + 1} sur {QUESTIONS.length}</span><span className="text-navy/75">{pct} %</span></div>
      <div role="progressbar" aria-label={`Question ${i + 1} sur ${QUESTIONS.length}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-brand-soft">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#4D93FF] transition-all duration-500" style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
      <fieldset className="mt-7">
        <legend className="font-display text-xl font-extrabold leading-snug sm:text-2xl">{q.label}</legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {q.kind === "single" && q.options!.map((o) => <Choice key={o} type="radio" name={q.code} label={o} checked={value === o} onChange={() => set(o)} />)}
          {q.kind === "multi" && q.options!.map((o) => <Choice key={o} type="checkbox" name={q.code} label={o} checked={((value as string[]) ?? []).includes(o)} onChange={() => toggle(o)} />)}
        </div>
        {q.kind === "number" && <Input aria-label={q.label} type="number" inputMode="numeric" min={2026} max={2035} placeholder="2027" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} className="mt-5 max-w-48 text-lg" />}
        {q.kind === "text" && <Textarea aria-label={q.label} maxLength={500} placeholder="Facultatif" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} className="mt-5" />}
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}
      <div className="mt-7 flex justify-between gap-3">
        <Button variant="ghost" size="lg" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Précédent</Button>
        <Button size="lg" onClick={next}>{i === QUESTIONS.length - 1 ? "Voir mon diagnostic" : "Suivant"}<Icon name="arrow" className="size-5" /></Button>
      </div>
    </div>
  );
}
