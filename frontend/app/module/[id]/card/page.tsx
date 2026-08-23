import { notFound, redirect } from "next/navigation";

import CardExercise from "@/components/CardExercise";
import { getModule } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

interface CardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const token = await getServerAuthToken();

  if (!token) {
    redirect(`/login?redirect=/module/${id}/card`);
  }

  const module = await getModule(id, { token });

  if (!module) {
    notFound();
  }

  return (
    <CardExercise
      moduleId={module.id}
      moduleTitle={module.title}
      terms={module.terms ?? []}
    />
  );
}
