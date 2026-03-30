import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    const [{ data: profile }, { data: conversations }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    const conversationIds = (conversations || []).map((c) => c.id);

    const { data: messages } = conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true })
      : { data: [] };

    const exportData = {
      exported_at: new Date().toISOString(),
      profile,
      conversations: (conversations || []).map((conv) => ({
        ...conv,
        messages: (messages || []).filter(
          (m) => m.conversation_id === conv.id
        ),
      })),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="mes-donnees.json"',
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
