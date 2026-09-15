import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/modules/auth/client/authClient";
import {
  bootstrapOfflineCloudState,
  flushOfflineMutations,
  resolveOfflineConflict,
  retryOfflineMutation,
} from "./syncEngine";
import {
  getLastOfflineUserId,
  getOfflineSyncSummary,
  listOfflineMutations,
  setActiveOfflineUser,
} from "./store";
import type { OfflineMutation, OfflineSyncSummary } from "./types";

interface OfflineSyncContextValue extends OfflineSyncSummary {
  canUseOfflineData: boolean;
  mutations: OfflineMutation[];
  syncNow(): Promise<void>;
  resolveConflict(id: string, strategy: "keep-local" | "use-cloud"): Promise<void>;
  retryMutation(id: string): Promise<void>;
}

const defaultSummary: OfflineSyncSummary = {
  online: true,
  syncing: false,
  pending: 0,
  conflicts: 0,
  errors: 0,
  lastSyncedAt: null,
  offlineUserId: null,
};

const OfflineSyncContext = createContext<OfflineSyncContextValue>({
  ...defaultSummary,
  canUseOfflineData: false,
  mutations: [],
  async syncNow() {},
  async resolveConflict() {},
  async retryMutation() {},
});

function currentOnlineState(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function OfflineSyncProvider({ children }: PropsWithChildren) {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(currentOnlineState);
  const [syncing, setSyncing] = useState(false);
  const [offlineUserId, setOfflineUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<OfflineSyncSummary>(defaultSummary);
  const [mutations, setMutations] = useState<OfflineMutation[]>([]);

  const refresh = useCallback(async () => {
    const rows = await listOfflineMutations();
    setMutations(rows);
    setSummary(await getOfflineSyncSummary(online, syncing, offlineUserId));
  }, [offlineUserId, online, syncing]);

  const syncNow = useCallback(async () => {
    if (!online || !offlineUserId || syncing) return;
    setSyncing(true);
    try {
      await flushOfflineMutations();
      await bootstrapOfflineCloudState();
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
    } catch (error) {
      console.warn("Offline/cloud synchronization failed", { error });
    } finally {
      setSyncing(false);
    }
  }, [offlineUserId, online, queryClient, syncing]);

  useEffect(() => {
    const userId = session.data?.user.id ?? null;
    if (userId) {
      setActiveOfflineUser(userId);
      setOfflineUserId(userId);
      return;
    }
    if (!online && !session.isPending) {
      const lastUserId = getLastOfflineUserId();
      setActiveOfflineUser(lastUserId);
      setOfflineUserId(lastUserId);
      return;
    }
    if (!session.isPending && online) {
      setActiveOfflineUser(null);
      setOfflineUserId(null);
    }
  }, [online, session.data?.user.id, session.isPending]);

  useEffect(() => {
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const onChanged = () => void refresh();
    window.addEventListener("endless-codex:offline-sync-changed", onChanged);
    void refresh();
    return () => window.removeEventListener("endless-codex:offline-sync-changed", onChanged);
  }, [refresh]);

  useEffect(() => {
    if (!online || !offlineUserId || !session.data?.user.id) return;
    void syncNow();
  }, [offlineUserId, online, session.data?.user.id, syncNow]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Offline application shell registration failed", { error });
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (online && offlineUserId && !syncing) void syncNow();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [offlineUserId, online, syncNow, syncing]);

  useEffect(() => {
    void refresh();
  }, [refresh, syncing]);

  const value = useMemo<OfflineSyncContextValue>(
    () => ({
      ...summary,
      online,
      syncing,
      offlineUserId,
      canUseOfflineData: Boolean(session.data || (!online && offlineUserId)),
      mutations,
      syncNow,
      async resolveConflict(id, strategy) {
        await resolveOfflineConflict(id, strategy);
        await refresh();
        await queryClient.invalidateQueries();
      },
      async retryMutation(id) {
        await retryOfflineMutation(id);
        await refresh();
      },
    }),
    [
      summary,
      online,
      syncing,
      offlineUserId,
      session.data,
      mutations,
      syncNow,
      refresh,
      queryClient,
    ],
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync(): OfflineSyncContextValue {
  return useContext(OfflineSyncContext);
}
