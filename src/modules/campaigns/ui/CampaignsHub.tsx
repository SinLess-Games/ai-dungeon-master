import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  Clock3,
  Play,
  RefreshCw,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import {
  getCampaign,
  listCampaigns,
  startCampaign,
  type CampaignListItem,
} from "../client/campaignCreatorApi";
import { CampaignCreator } from "./CampaignCreator";
import { CampaignDraftEditor } from "./CampaignDraftEditor";

type HubMode = "library" | "create" | "edit";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The campaign could not be loaded.";
}

function statusLabel(status: string) {
  if (status === "draft") return "Setup in progress";
  if (status === "ready") return "Ready to start";
  if (status === "starting") return "Generating world";
  if (status === "active") return "Active";
  if (status === "paused") return "Paused";
  if (status === "completed") return "Completed";
  if (status === "archived") return "Archived";
  return status;
}

function dateLabel(value: string | number | null) {
  if (value === null) return "Never";
  const date = typeof value === "number" ? new Date(value < 10_000_000_000 ? value * 1000 : value) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString();
}

export function CampaignsHub() {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<HubMode>("library");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const campaigns = useQuery({
    queryKey: ["campaigns", "library"],
    queryFn: listCampaigns,
    enabled: Boolean(session.data),
  });

  const detail = useQuery({
    queryKey: ["campaigns", "detail", selectedCampaignId],
    queryFn: () => getCampaign(selectedCampaignId!),
    enabled: Boolean(session.data && selectedCampaignId && mode === "edit"),
  });

  const start = useMutation({
    mutationFn: startCampaign,
    onSuccess: async () => {
      toast.success("Campaign started. The world is ready.");
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function openLibrary() {
    setMode("library");
    setSelectedCampaignId(null);
    void queryClient.invalidateQueries({ queryKey: ["campaigns", "library"] });
  }

  function openCampaign(campaign: CampaignListItem) {
    setSelectedCampaignId(campaign.id);
    setMode("edit");
  }

  if (session.isPending) {
    return <HubState title="Opening campaigns…" body="Loading your Endless Codex account." />;
  }

  if (!session.data) {
    return (
      <HubState
        title="Sign in to manage campaigns"
        body="Campaign worlds, settings, characters, and saves belong to your Endless Codex account."
        action={
          <button
            type="button"
            onClick={useAuthModal.getState().openLogin}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Sign in
          </button>
        }
      />
    );
  }

  if (mode === "create") {
    return (
      <div>
        <div className="mx-auto max-w-[1560px] px-4 pt-5 lg:px-8">
          <button
            type="button"
            onClick={openLibrary}
            className="text-sm font-semibold text-muted-foreground hover:text-gold"
          >
            ← Back to campaigns
          </button>
        </div>
        <CampaignCreator />
      </div>
    );
  }

  if (mode === "edit" && selectedCampaignId) {
    if (detail.isLoading) {
      return <HubState title="Opening campaign setup…" body="Loading the saved campaign draft." />;
    }
    if (detail.error || !detail.data) {
      return (
        <HubState
          title="Campaign could not be opened"
          body={detail.error?.message ?? "Campaign data was unavailable."}
          action={
            <button type="button" onClick={openLibrary} className="rounded-lg border border-border px-4 py-2 font-semibold">
              Back to campaigns
            </button>
          }
        />
      );
    }
    return (
      <CampaignDraftEditor
        detail={detail.data}
        onBack={openLibrary}
        onSaved={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["campaigns", "library"] }),
            queryClient.invalidateQueries({ queryKey: ["campaigns", "detail", selectedCampaignId] }),
          ]);
        }}
      />
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] px-4 py-10 lg:px-8" id="main-content">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">Persistent worlds</p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Your Campaigns</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Create a campaign, resume setup later, add characters, and start the world when the party is ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode("create")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            <CirclePlus className="h-5 w-5" /> Create campaign
          </button>
        </div>

        {campaigns.isLoading ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Loading campaigns…
          </div>
        ) : campaigns.error ? (
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-card p-8 text-center">
            <p>{campaigns.error.message}</p>
            <button
              type="button"
              onClick={() => void campaigns.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : campaigns.data?.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.data.map((campaign) => (
              <article
                key={campaign.id}
                className="group rounded-2xl border border-border bg-card/85 p-5 shadow-lg transition hover:border-gold/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                      {campaign.rulesetId.toUpperCase()} {campaign.rulesetVersion}
                    </p>
                    <h2 className="mt-1 font-display text-2xl">{campaign.name}</h2>
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {statusLabel(campaign.status)}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-muted-foreground">
                  {campaign.description || "No campaign description yet."}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <Info icon={<Users className="h-4 w-4" />} label="Table" value={campaign.playMode === "solo" ? "Solo" : "Multiplayer"} />
                  <Info icon={<Shield className="h-4 w-4" />} label="DM" value={campaign.gameMasterMode === "ai" ? "AI DM" : campaign.gameMasterMode} />
                  <Info icon={<Clock3 className="h-4 w-4" />} label="Updated" value={dateLabel(campaign.updatedAt)} />
                  <Info icon={<BookOpen className="h-4 w-4" />} label="World" value={campaign.worldId ? "Generated" : "Not started"} />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["draft", "ready"].includes(campaign.status) ? (
                    <button
                      type="button"
                      onClick={() => openCampaign(campaign)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold transition hover:border-gold/50 hover:text-gold"
                    >
                      {campaign.status === "draft" ? "Continue setup" : "Review setup"}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCampaign(campaign)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold"
                    >
                      View setup <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  {campaign.status === "ready" ? (
                    <button
                      type="button"
                      disabled={start.isPending}
                      onClick={() => {
                        if (window.confirm(`Start ${campaign.name}? This generates its persistent world and locks creator settings.`)) {
                          start.mutate(campaign.id);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" /> Start
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-10 rounded-2xl border border-dashed border-gold/30 bg-card/60 p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <Swords className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-3xl">Your first story starts here</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Build the campaign concept, world profile, rules, players, AI Dungeon Master, and content policy in one guided flow.
            </p>
            <button
              type="button"
              onClick={() => setMode("create")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              <CirclePlus className="h-5 w-5" /> Create campaign
            </button>
          </section>
        )}

        <div className="mt-8 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-gold" /> MVP flow
          </span>
          <span className="ml-2">Campaign setup → character creation → ready campaign → world generation.</span>
        </div>
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</dt>
      <dd className="mt-1 truncate font-medium capitalize">{value}</dd>
    </div>
  );
}

function HubState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{body}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}
