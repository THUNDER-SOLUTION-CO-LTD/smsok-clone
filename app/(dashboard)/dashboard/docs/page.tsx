import { redirect } from "next/navigation";

export default function DocsRedirect() {
  redirect("/dashboard/api-docs");
}
