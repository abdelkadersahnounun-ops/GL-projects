import Link from "next/link";
import {
  AudioLines,
  Clapperboard,
  Download,
  History,
  LayoutTemplate,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  { icon: Users, title: "Choisissez un avatar", desc: "Parcourez une bibliothèque d'avatars IA (genre, style, langue) et sélectionnez celui qui représente votre message." },
  { icon: AudioLines, title: "Importez votre audio", desc: "Glissez un fichier audio et transformez la voix — par exemple vers une voix féminine — en un clic." },
  { icon: LayoutTemplate, title: "Choisissez un décor", desc: "Studio, bureau, extérieur, abstrait ou couleur unie : composez l'arrière-plan de votre vidéo." },
  { icon: Sliders, title: "Configurez", desc: "Format (16:9, 9:16, 1:1), résolution, sous-titres, nombre de variantes à générer." },
  { icon: Clapperboard, title: "Générez", desc: "Suivez la progression en temps réel pendant que votre vidéo est composée automatiquement." },
  { icon: Download, title: "Téléchargez", desc: "Prévisualisez, téléchargez vos vidéos et retrouvez tout votre historique de projets." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-white">
            <Clapperboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AvatarStudio</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Créer un compte</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pb-20 pt-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Génération vidéo par avatar IA
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Créez des vidéos avec des avatars IA,{" "}
          <span className="bg-gradient-brand bg-clip-text text-transparent">automatiquement</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Choisissez un avatar, importez votre audio, transformez la voix, ajoutez un décor et générez vos vidéos
          en quelques minutes. Un vrai pipeline de production fonctionnel, prêt pour la démo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Commencer gratuitement
              <Sparkles className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="bg-card/60">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">
                  {i + 1}. {step.title}
                </CardTitle>
                <CardDescription>{step.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-24">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <History className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-semibold">Un historique complet de vos projets</h2>
            <p className="max-w-lg text-sm text-muted-foreground">
              Retrouvez chaque vidéo générée, son statut, ses paramètres et téléchargez-la à nouveau à tout moment.
            </p>
            <Button asChild>
              <Link href="/register">Essayer maintenant</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        AvatarStudio — Démo SaaS de génération vidéo par avatars IA.
      </footer>
    </div>
  );
}
