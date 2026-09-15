import { z } from "zod";

export const campaignLengthOptions = [
  { id: "short", name: "Short", description: "A focused adventure with a clear resolution." },
  {
    id: "medium",
    name: "Medium",
    description: "Several connected adventures building to a finale.",
  },
  {
    id: "long",
    name: "Long",
    description: "An extended saga with room for character and world arcs.",
  },
  {
    id: "endless",
    name: "Endless",
    description: "An ongoing world with satisfying individual story arcs.",
  },
] as const;

export const campaignDurationSchema = z
  .object({
    length: z.enum(["short", "medium", "long", "endless"]),
    estimatedSessions: z.number().int().min(1).max(1000).optional(),
    startLevel: z.number().int().min(1).max(100).optional(),
    endLevel: z.number().int().min(1).max(100).optional(),
    endingTarget: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.startLevel === undefined ||
      value.endLevel === undefined ||
      value.endLevel >= value.startLevel,
    { path: ["endLevel"], message: "Ending level must be at least the starting level." },
  );

export type CampaignDuration = z.infer<typeof campaignDurationSchema>;

/** Missing duration remains unspecified for campaigns created before this setting existed. */
export function readCampaignDuration(value: unknown): CampaignDuration | undefined {
  const result = campaignDurationSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
