import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { sendMessage } from "@/app/shared-actions";
import { cn } from "@/components/ui/cn";

export interface Msg { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }

export function MessageThread({ messages, meId, conversationId, back }: { messages: Msg[]; meId: string; conversationId: string; back: string }) {
  return (
    <div className="space-y-4">
      <ol className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-navy/10 bg-white p-4" aria-label="Messages" tabIndex={0}>
        {messages.length === 0 && <li className="text-sm text-navy/60">Aucun message pour le moment. Écrivez le premier.</li>}
        {messages.map((m) => (
          <li key={m.id} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", m.sender_id === meId ? "ml-auto bg-brand text-white" : "bg-brand-soft")}>
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className={cn("mt-1 text-[11px]", m.sender_id === meId ? "text-white/75" : "text-navy/55")}>{new Date(m.created_at).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" })}{m.sender_id === meId && m.read_at ? " · lu" : ""}</p>
          </li>
        ))}
      </ol>
      <form action={sendMessage} className="space-y-2">
        <input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="back" value={back} />
        <Textarea name="body" required maxLength={4000} aria-label="Votre message" placeholder="Votre message…" className="min-h-20" />
        <Button type="submit">Envoyer</Button>
        <p className="text-xs text-navy/60">N&apos;envoyez ici ni mot de passe ni pièce d&apos;identité : utilisez « Mes documents ».</p>
      </form>
    </div>
  );
}
