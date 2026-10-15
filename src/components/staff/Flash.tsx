import { ErrorState } from "@/components/ui/EmptyState";
import { readFlash } from "@/lib/flash";

/** Affiche les messages de retour d'action. Seuls les messages signés par le serveur (et non expirés) sont montrés. */
export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  const okText = readFlash("ok", ok);
  const errText = readFlash("erreur", erreur);
  return (<>
    {okText && <p role="status" className="rounded-lg bg-[#dff5ea] p-3 text-sm font-medium text-[#0d7a50]">{okText}</p>}
    {errText && <ErrorState message={errText} />}
  </>);
}
