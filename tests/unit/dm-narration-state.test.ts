import { describe, expect, it } from "vitest";
import { parseDmTurnDecision } from "@/modules/campaigns/server/dmToolPlanner";

describe("AI DM narration state metadata", () => {
  it("parses named NPC memory attached to narration", () => {
    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "narration",
          text: "Mara lowers the lantern and studies you carefully.",
          npcs: [
            {
              name: "Mara Venn",
              role: "gate warden",
              description: "A scarred veteran carrying a blue lantern.",
              location: "West Gate",
              attitude: "wary but curious",
            },
          ],
        }),
      ),
    ).toEqual({
      kind: "narration",
      text: "Mara lowers the lantern and studies you carefully.",
      npcs: [
        {
          name: "Mara Venn",
          role: "gate warden",
          description: "A scarred veteran carrying a blue lantern.",
          location: "West Gate",
          attitude: "wary but curious",
        },
      ],
    });
  });

  it("parses narration item awards that must become authoritative inventory grants", () => {
    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "narration",
          text: "Mara presses a healing draught into your hand.",
          npcs: [{ id: "npc-mara", name: "Mara Venn" }],
          itemAwards: [
            {
              itemRef: "potion-of-cure-light-wounds",
              quantity: 1,
              location: "carried",
              reason: "Mara gives the potion to the acting character.",
            },
          ],
        }),
      ),
    ).toEqual({
      kind: "narration",
      text: "Mara presses a healing draught into your hand.",
      npcs: [{ id: "npc-mara", name: "Mara Venn" }],
      itemAwards: [
        {
          itemRef: "potion-of-cure-light-wounds",
          quantity: 1,
          location: "carried",
          reason: "Mara gives the potion to the acting character.",
        },
      ],
    });
  });
});
