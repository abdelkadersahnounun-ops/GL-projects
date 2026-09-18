import { MockAvatarProvider } from "./mock-provider";
import type { AvatarProvider } from "./types";

let instance: AvatarProvider | null = null;

/**
 * Provider factory. Today only "mock" exists; set AVATAR_PROVIDER=heygen
 * (once implemented) to switch the whole app to a real avatar API without
 * touching any calling code.
 */
export function getAvatarProvider(): AvatarProvider {
  if (instance) return instance;
  const kind = process.env.AVATAR_PROVIDER ?? "mock";
  switch (kind) {
    case "mock":
    default:
      instance = new MockAvatarProvider();
  }
  return instance;
}

export type { AvatarProvider, AvatarDTO } from "./types";
