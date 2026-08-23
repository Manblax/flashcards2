import SpellExercise from "@/components/SpellExercise";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { notFound, redirect } from "next/navigation";

interface SpellPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SpellPage({ params }: SpellPageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/spell`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    notFound();
  }

  return (
    <SpellExercise
      moduleId={module.id}
      moduleTitle={module.title}
      terms={module.terms ?? []}
    />
  );
}
