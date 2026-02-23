"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, user } = useSession();

  useEffect(() => {
    if (isLoggedIn && user) {
      router.replace(`/${user.role}/dashboard`);
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
