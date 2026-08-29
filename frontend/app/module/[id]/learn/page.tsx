import { notFound, redirect } from "next/navigation";

import LearnExercise from "@/components/LearnExercise";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

interface LearnPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/learn`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    notFound();
  }

  return (
    <LearnExercise
      moduleId={module.id}
      moduleTitle={module.title}
      terms={module.terms ?? []}
    />
  );
}
