import { redirect } from "next/navigation";

/**
 * Settings Webhooks — server-side redirect to the main Webhooks page.
 * The full webhook workspace lives at /dashboard/webhooks
 * with correct API contracts and real CRUD.
 */
export default function SettingsWebhooksRedirect() {
  redirect("/dashboard/webhooks");
}
