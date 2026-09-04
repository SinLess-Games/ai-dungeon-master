import { useEffect, useState } from "react";
import { AUTH_EVENT, getSession, startAuthListener, type SessionUser } from "@/lib/auth";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startAuthListener();
    const sync = () => setUser(getSession());
    sync();
    setLoading(false);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading };
}
