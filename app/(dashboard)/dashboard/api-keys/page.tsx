import { getSession } from "@/lib/auth";
import { getApiKeys } from "@/lib/actions/api-keys";
import ApiKeysContent from "./ApiKeysContent";

export default async function ApiKeysPage() {
  const user = await getSession();

  const apiKeys = await getApiKeys(user!.id);

  return (
    <ApiKeysContent userId={user!.id} apiKeys={apiKeys} />
  );
}
