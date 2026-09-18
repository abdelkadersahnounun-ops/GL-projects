import Link from "next/link";
import { Clapperboard } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-noise bg-gradient-brand px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <Clapperboard className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">AvatarStudio</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
