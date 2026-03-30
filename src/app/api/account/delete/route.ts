import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Account deletion error:", error);
      return new Response("Failed to delete account", { status: 500 });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Account deletion error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
