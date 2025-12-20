import { mockModules } from "@/lib/mockData";
import ModuleForm from "@/components/ModuleForm";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const module = mockModules.find((m) => m.id === id);

  if (!module) {
    return (
      <div className="container mx-auto px-6 py-8 text-center text-error">
        Модуль не найден
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <ModuleForm mode="edit" initialData={module} />
    </div>
  );
}

