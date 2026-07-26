import ModuleForm from "@/components/ModuleForm";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { redirect } from "next/navigation";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/edit`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-error sm:px-6 sm:py-8">
        Модуль не найден
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <ModuleForm mode="edit" initialData={module} />
    </div>
  );
}
