"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { Progress } from "@/components/ui/Progress";
import { QUESTIONS } from "@/lib/orientation/questions";
import { buildDiagnostic, validateAnswers, type Answers } from "@/lib/orientation/diagnostic";

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
      <div className="space-y-6" aria-live="polite">
        <Card>
          <h2 className="font-display text-xl font-bold">Votre profil</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {d.profile.map((p) => <div key={p.label}><dt className="text-navy/60">{p.label}</dt><dd className="font-semibold">{p.value}</dd></div>)}
          </dl>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-bold">Nous vous recommandons</h2>
          <p className="mt-1 text-sm text-navy/70">Votre profil correspond à plusieurs possibilités.</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">{d.recommendations.map((r) => <li key={r}>{r}</li>)}</ol>
          {d.notes.length > 0 && <ul className="mt-4 space-y-1.5 rounded-lg bg-[#fff4d6] p-3 text-sm">{d.notes.map((n) => <li key={n}>⚠ {n}</li>)}</ul>}
          <p className="mt-4 text-xs text-navy/60">Ce diagnostic est indicatif. Il ne garantit ni admission ni visa : la décision finale appartient aux établissements et aux autorités compétentes.</p>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="cta">Parler à un conseiller</ButtonLink>
          <ButtonLink href={`/packs/${d.suggestedPack}`} variant="outline">Découvrir les packs</ButtonLink>
          <Button variant="ghost" onClick={() => { setDone(false); setI(0); setAnswers({}); }}>Refaire le test</Button>
        </div>
        <p className="text-sm text-navy/70"><Link href="/inscription" className="font-semibold text-brand underline">Créez un compte</Link> pour suivre votre projet avec un conseiller.</p>
      </div>
    );
  }

  return (
    <Card>
      <Progress value={(i / QUESTIONS.length) * 100} label={`Question ${i + 1} sur ${QUESTIONS.length}`} />
      <fieldset className="mt-6">
        <legend className="font-display text-lg font-bold">{q.label}</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.kind === "single" && q.options!.map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-navy/20 px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name={q.code} checked={value === o} onChange={() => set(o)} className="size-4 accent-[#0b63f6]" />{o}
            </label>
          ))}
          {q.kind === "multi" && q.options!.map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-navy/20 px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="checkbox" checked={((value as string[]) ?? []).includes(o)} onChange={() => toggle(o)} className="size-4 accent-[#0b63f6]" />{o}
            </label>
          ))}
        </div>
        {q.kind === "number" && <Input aria-label={q.label} type="number" inputMode="numeric" min={2026} max={2035} placeholder="2027" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} className="max-w-40" />}
        {q.kind === "text" && <Textarea aria-label={q.label} maxLength={500} placeholder="Facultatif" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} />}
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}
      <div className="mt-6 flex justify-between gap-3">
        <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Précédent</Button>
        <Button onClick={next}>{i === QUESTIONS.length - 1 ? "Voir mon diagnostic" : "Suivant"}</Button>
      </div>
    </Card>
  );
}
