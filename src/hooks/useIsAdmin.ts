import { useEffect, useState } from "react";
import { readAdminRole } from "@/lib/database.functions";
import { useSession } from "@/hooks/useSession";

/** True when the signed-in account holds the admin role. */
export function useIsAdmin() {
  const { user } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    void readAdminRole()
      .then((isAdmin) => {
        if (!active) return;
        setIsAdmin(isAdmin);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return { isAdmin, loading };
}
