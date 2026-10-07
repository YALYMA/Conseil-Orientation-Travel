"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories";
import { validateUpload } from "@/lib/documents/validate";

export function DocumentUploader({ documentId, maxMb = 10, defaultCategory, defaultName }: { documentId?: string; maxMb?: number; defaultCategory?: string; defaultName?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setOk(false);
    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return setError("Choisissez un fichier.");
    const check = validateUpload({ name: file.name, type: file.type, size: file.size }, maxMb); // confort : le serveur revalide
    if (!check.ok) return setError(check.error);
    if (documentId) form.set("documentId", documentId);
    setBusy(true);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Échec du téléversement.");
      setOk(true); (e.target as HTMLFormElement).reset(); router.refresh();
    } catch { setError("Connexion impossible. Réessayez."); } finally { setBusy(false); }
  }

  const id = documentId ?? "new";
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Catégorie" htmlFor={`cat-${id}`}><Select id={`cat-${id}`} name="category" defaultValue={defaultCategory}>{DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Nom du document" htmlFor={`name-${id}`}><Input id={`name-${id}`} name="name" required minLength={2} maxLength={120} defaultValue={defaultName} /></Field>
      </div>
      <Field label={`Fichier (PDF, JPG, PNG ou DOCX, ${maxMb} Mo max)`} htmlFor={`file-${id}`}><Input id={`file-${id}`} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" required /></Field>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      {ok && <p role="status" className="text-sm font-medium text-success">Document envoyé. Votre conseiller va le vérifier.</p>}
      <Button type="submit" disabled={busy}>{busy ? "Envoi…" : documentId ? "Envoyer une nouvelle version" : "Ajouter le document"}</Button>
    </form>
  );
}
