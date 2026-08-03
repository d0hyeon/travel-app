import { apiClient } from "~api/client";

export default async function handler() {
  try {
    await apiClient.get("/functions/v1/health");

    return Response.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    return Response.json({ ok: false, message }, { status: 500 });
  }
}
