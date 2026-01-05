import ModuleForm from "@/components/ModuleForm";
import { getModule } from "@/lib/api";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const module = await getModule(id);

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

