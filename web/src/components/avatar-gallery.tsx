"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

import type { AvatarDTO } from "@/server/avatars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GENDER_LABELS: Record<string, string> = { MALE: "Homme", FEMALE: "Femme", NEUTRAL: "Neutre" };

export function AvatarGallery({ avatars }: { avatars: AvatarDTO[] }) {
  const [genderFilter, setGenderFilter] = useState("ALL");

  const filtered = useMemo(
    () => (genderFilter === "ALL" ? avatars : avatars.filter((a) => a.gender === genderFilter)),
    [avatars, genderFilter],
  );

  return (
    <div className="space-y-6">
      <Tabs value={genderFilter} onValueChange={setGenderFilter}>
        <TabsList>
          <TabsTrigger value="ALL">Tous</TabsTrigger>
          <TabsTrigger value="FEMALE">Femmes</TabsTrigger>
          <TabsTrigger value="MALE">Hommes</TabsTrigger>
          <TabsTrigger value="NEUTRAL">Neutres</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((avatar) => (
          <Card key={avatar.id} className="overflow-hidden">
            <div className="relative aspect-square w-full bg-secondary">
              <Image src={avatar.thumbnailUrl} alt={avatar.name} fill sizes="280px" className="object-cover" />
            </div>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{avatar.name}</p>
                <Badge variant="outline">{avatar.language}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{avatar.type}</Badge>
                <Badge variant="secondary">{avatar.style}</Badge>
                <Badge variant="secondary">{GENDER_LABELS[avatar.gender] ?? avatar.gender}</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/projects/new?avatarId=${avatar.id}`}>
                  <Sparkles className="h-4 w-4" />
                  Utiliser cet avatar
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
