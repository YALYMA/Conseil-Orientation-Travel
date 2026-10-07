import { ErrorState } from "@/components/ui/EmptyState";
export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  return (<>
    {ok && <p role="status" className="rounded-lg bg-[#dff5ea] p-3 text-sm font-medium text-[#0d7a50]">{ok.slice(0, 120)}</p>}
    {erreur && <ErrorState message={erreur.slice(0, 200)} />}
  </>);
}
