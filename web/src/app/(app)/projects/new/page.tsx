import { getAvatarProvider } from "@/server/avatars";
import { listBackgrounds } from "@/server/backgrounds";
import { ProjectWizard } from "@/components/wizard/project-wizard";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ avatarId?: string }>;
}) {
  const { avatarId } = await searchParams;
  const [avatars, backgrounds] = await Promise.all([getAvatarProvider().listAvatars(), listBackgrounds()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau projet</h1>
        <p className="text-muted-foreground">Suivez les étapes pour générer votre vidéo avec un avatar IA.</p>
      </div>
      <ProjectWizard avatars={avatars} backgrounds={backgrounds} initialAvatarId={avatarId} />
    </div>
  );
}
