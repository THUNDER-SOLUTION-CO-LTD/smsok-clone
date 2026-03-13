import { redirect } from "next/navigation";

export default function TopupRedirect() {
  redirect("/dashboard/packages");
}
