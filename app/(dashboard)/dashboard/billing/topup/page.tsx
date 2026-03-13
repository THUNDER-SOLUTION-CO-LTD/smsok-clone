import { redirect } from "next/navigation";

export default function BillingTopupRedirect() {
  redirect("/dashboard/billing/packages");
}
