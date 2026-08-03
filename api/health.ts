import { supabase } from "~api/client";

export default async function handler() {
  const { error } = await supabase.functions.invoke("health");
  if (error != null) {
    console.error("Supabase health check failed:", error);

    return Response.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
  });
}
