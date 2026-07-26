import ModuleForm from "@/components/ModuleForm";
import { getServerAuthToken } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function CreatePage() {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login?redirect=/create");
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <ModuleForm mode="create" />
    </div>
  );
}
