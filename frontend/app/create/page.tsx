import ModuleForm from "@/components/ModuleForm";
import { getServerAuthToken } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function CreatePage() {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login?redirect=/create");
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <ModuleForm mode="create" />
    </div>
  );
}
