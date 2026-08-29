import { notFound, redirect } from "next/navigation";

import TestExercise from "@/components/TestExercise";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

interface TestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/test`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    notFound();
  }

  return (
    <TestExercise
      moduleId={module.id}
      moduleTitle={module.title}
      terms={module.terms ?? []}
    />
  );
}
