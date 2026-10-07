import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/student/MessageThread";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const me = await requireRole(["student"]);
  const { erreur } = await searchParams;
  const supabase = await createClient();
  const { data: conv } = await supabase.from("conversations").select("id, advisor_id").maybeSingle();
  if (conv) await supabase.rpc("mark_conversation_read", { p_conversation: conv.id });
  const { data: messages } = conv ? await supabase.from("messages").select("id, sender_id, body, created_at, read_at").eq("conversation_id", conv.id).order("created_at", { ascending: true }).limit(200) : { data: [] };
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Messages</h1>
      {erreur && <ErrorState message={erreur.slice(0, 200)} />}
      {!conv ? <EmptyState title="Messagerie indisponible" text="Votre conversation n'est pas encore créée. Contactez-nous." /> : (
        <>
          {!conv.advisor_id && <p role="status" className="rounded-lg bg-[#fff4d6] p-3 text-sm">Un conseiller va vous être assigné. Vous pouvez déjà écrire : votre message sera lu par l&apos;équipe.</p>}
          <MessageThread messages={messages ?? []} meId={me.id} conversationId={conv.id} back="/app/messages" />
        </>
      )}
    </div>
  );
}
