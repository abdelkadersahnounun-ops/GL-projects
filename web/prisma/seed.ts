import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { getStorageProvider } from "../src/server/storage";
import { generateAvatarImage, generateBackgroundImage, generateColorSwatch } from "./seed-assets";

const prisma = new PrismaClient();
const storage = getStorageProvider();

const AVATAR_SPECS = [
  { slug: "alexandre", name: "Alexandre", initials: "AL", type: "réaliste", style: "professionnel", gender: "MALE" as const, language: "fr-FR", colorFrom: "0x3730a3", colorTo: "0x1e1b4b" },
  { slug: "sofia", name: "Sofia", initials: "SO", type: "réaliste", style: "présentatrice", gender: "FEMALE" as const, language: "fr-FR", colorFrom: "0xbe185d", colorTo: "0x701a75" },
  { slug: "marcus", name: "Marcus", initials: "MA", type: "illustré", style: "décontracté", gender: "MALE" as const, language: "en-US", colorFrom: "0x0f766e", colorTo: "0x134e4a" },
  { slug: "lea", name: "Léa", initials: "LE", type: "réaliste", style: "corporate", gender: "FEMALE" as const, language: "fr-FR", colorFrom: "0xb45309", colorTo: "0x78350f" },
  { slug: "noah", name: "Noah", initials: "NO", type: "3d", style: "moderne", gender: "NEUTRAL" as const, language: "en-US", colorFrom: "0x0369a1", colorTo: "0x082f49" },
  { slug: "amara", name: "Amara", initials: "AM", type: "illustré", style: "créatif", gender: "FEMALE" as const, language: "en-US", colorFrom: "0xe11d48", colorTo: "0x881337" },
  { slug: "kenji", name: "Kenji", initials: "KE", type: "réaliste", style: "tech", gender: "MALE" as const, language: "ja-JP", colorFrom: "0x4338ca", colorTo: "0x312e81" },
  { slug: "mia", name: "Mia", initials: "MI", type: "3d", style: "énergique", gender: "FEMALE" as const, language: "es-ES", colorFrom: "0x65a30d", colorTo: "0x365314" },
];

const BACKGROUND_SPECS: Array<
  | { slug: string; name: string; category: string; kind: "image"; colorFrom: string; colorTo: string }
  | { slug: string; name: string; category: string; kind: "color"; color: string }
> = [
  { slug: "studio-violet", name: "Studio violet", category: "studio", kind: "image", colorFrom: "0x1e1b4b", colorTo: "0x0b0b12" },
  { slug: "bureau-moderne", name: "Bureau moderne", category: "office", kind: "image", colorFrom: "0x1e3a8a", colorTo: "0x334155" },
  { slug: "exterieur-dore", name: "Extérieur doré", category: "outdoor", kind: "image", colorFrom: "0xea580c", colorTo: "0x78350f" },
  { slug: "abstrait-neon", name: "Abstrait néon", category: "abstract", kind: "image", colorFrom: "0xd946ef", colorTo: "0x0891b2" },
  { slug: "degrade-sombre", name: "Dégradé sombre", category: "abstract", kind: "image", colorFrom: "0x0f172a", colorTo: "0x000000" },
  { slug: "fond-blanc", name: "Fond uni blanc", category: "solid", kind: "color", color: "#f4f4f8" },
];

async function seedAvatars() {
  for (const spec of AVATAR_SPECS) {
    const existing = await prisma.avatar.findFirst({ where: { provider: "mock", externalId: spec.slug } });
    if (existing) continue;

    const key = await generateAvatarImage(storage, {
      slug: spec.slug,
      initials: spec.initials,
      colorFrom: spec.colorFrom,
      colorTo: spec.colorTo,
    });
    const url = storage.getObjectUrl(key);

    await prisma.avatar.create({
      data: {
        provider: "mock",
        externalId: spec.slug,
        name: spec.name,
        type: spec.type,
        style: spec.style,
        gender: spec.gender,
        language: spec.language,
        thumbnailKey: key,
        thumbnailUrl: url,
      },
    });
    console.log(`  ✓ avatar: ${spec.name}`);
  }
}

async function seedBackgrounds() {
  for (const spec of BACKGROUND_SPECS) {
    const existing = await prisma.background.findFirst({ where: { name: spec.name } });
    if (existing) continue;

    if (spec.kind === "color") {
      const thumbnailKey = await generateColorSwatch(storage, spec.slug, spec.color);
      await prisma.background.create({
        data: {
          name: spec.name,
          category: spec.category,
          kind: "color",
          colorValue: spec.color,
          thumbnailKey,
          thumbnailUrl: storage.getObjectUrl(thumbnailKey),
          assetKey: null,
          assetUrl: null,
        },
      });
    } else {
      const { assetKey, thumbnailKey } = await generateBackgroundImage(storage, {
        slug: spec.slug,
        colorFrom: spec.colorFrom,
        colorTo: spec.colorTo,
      });
      await prisma.background.create({
        data: {
          name: spec.name,
          category: spec.category,
          kind: "image",
          colorValue: null,
          thumbnailKey,
          thumbnailUrl: storage.getObjectUrl(thumbnailKey),
          assetKey,
          assetUrl: storage.getObjectUrl(assetKey),
        },
      });
    }
    console.log(`  ✓ background: ${spec.name}`);
  }
}

async function seedDemoUser() {
  const email = "demo@avatarstudio.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash("Demo1234!", 12);
  await prisma.user.create({
    data: { name: "Demo", email, passwordHash },
  });
  console.log(`  ✓ demo user: ${email} / Demo1234!`);
}

async function main() {
  console.log("Seeding avatars...");
  await seedAvatars();
  console.log("Seeding backgrounds...");
  await seedBackgrounds();
  console.log("Seeding demo user...");
  await seedDemoUser();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
