"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { username, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ["/login", "/"];
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (!isLoading && !username && !isPublic) {
      router.replace("/login");
    }
  }, [username, isLoading, isPublic, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!username && !isPublic) return null;

  return <>{children}</>;
}
