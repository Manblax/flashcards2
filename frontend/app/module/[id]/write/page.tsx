import WriteExercise from "@/components/WriteExercise";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { notFound, redirect } from "next/navigation";

interface WritePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WritePage({ params }: WritePageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/write`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    notFound();
  }

  return (
    <WriteExercise
      moduleId={module.id}
      moduleTitle={module.title}
      terms={module.terms ?? []}
    />
  );
}
