import { useState, type ReactNode } from "react";
import { Bug, Lightbulb, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/database.functions";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

type Kind = "bug" | "feature";

export function FeedbackDialog({ trigger }: { trigger: ReactNode }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("bug");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    if (!user) {
      toast.error("Please sign in first so we can follow up on your report.");
      return;
    }
    if (trimmedTitle.length < 4) {
      toast.error("Give it a short summary first (at least 4 characters).");
      return;
    }
    setSaving(true);
    const { error } = await submitFeedback({
      data: {
        kind,
        title: trimmedTitle.slice(0, 140),
        details: trimmedDetails.slice(0, 4000),
        page_url: typeof window === "undefined" ? null : window.location.pathname,
      },
    }).catch(() => ({ error: true }));
    setSaving(false);
    if (error) {
      toast.error("That did not send. Please try again in a moment.");
      return;
    }
    toast.success(kind === "bug" ? "Bug reported — thank you!" : "Idea sent — thank you!");
    setTitle("");
    setDetails("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Send feedback</DialogTitle>
          <DialogDescription>
            Report something broken or suggest an idea. It lands straight on the team&apos;s board.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "bug", label: "Bug report", icon: Bug },
              { value: "feature", label: "Feature idea", icon: Lightbulb },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                kind === value
                  ? "border-primary/70 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-title">Summary</Label>
          <Input
            id="feedback-title"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "bug" ? "Dice tray freezes after a roll" : "Let me rename my party"
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-details">Details</Label>
          <Textarea
            id="feedback-details"
            value={details}
            maxLength={4000}
            rows={5}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What happened, what you expected, and how to see it again."
          />
        </div>

        {!user ? <p className="text-sm text-muted-foreground">Sign in to send feedback.</p> : null}

        <DialogFooter>
          <Button onClick={() => void submit()} disabled={saving || !user}>
            <Send className="mr-2 size-4" />
            {saving ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
