import { getAvatarProvider } from "@/server/avatars";
import { AvatarGallery } from "@/components/avatar-gallery";

export default async function AvatarsPage() {
  const avatars = await getAvatarProvider().listAvatars();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bibliothèque d&apos;avatars</h1>
        <p className="text-muted-foreground">
          Choisissez un avatar pour votre prochaine vidéo. D&apos;autres fournisseurs d&apos;avatars pourront être
          ajoutés sans changer le reste de l&apos;application.
        </p>
      </div>
      <AvatarGallery avatars={avatars} />
    </div>
  );
}
