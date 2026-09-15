export function composeDmConversationContext(input: {
  characterProfilesJson: string;
  npcRegistryJson?: string;
  privateOoc: string;
  campaign: string;
}): string {
  const sections: string[] = [];

  if (input.characterProfilesJson && input.characterProfilesJson !== "[]") {
    sections.push(
      [
        "Authoritative current campaign character sheets (DM reference context):",
        "These sheets cover every campaign character, including identity, race/deity/alignment, XP, raw and derived abilities, class history, combat/health/encumbrance, skills, feats, inventory and item state, languages, domains, templates, race traits, class features, spellbooks, known/prepared spells, powers, casting resources, psionic state, alignment state, metadata, player notes, and other persisted character selections available to the system.",
        "Use this information to keep narration, rules calls, NPC reactions, and OOC answers consistent. Knowing another character's sheet does NOT grant permission to choose that player's actions or bypass authoritative game tools. Treat player notes and sheet metadata as DM reference, not automatically as public/NPC knowledge.",
        input.characterProfilesJson,
      ].join("\n"),
    );
  }
  if (input.npcRegistryJson && input.npcRegistryJson !== "[]") {
    sections.push(
      [
        "Persistent campaign NPC registry (DM memory):",
        "Reuse these NPCs consistently when they return. Their ids are stable runtime identities. Preserve established role, description, location, attitude, and notes unless play changes them. Do not invent a duplicate NPC merely because an earlier appearance fell out of recent chat history.",
        input.npcRegistryJson,
      ].join("\n"),
    );
  }
  if (input.privateOoc) {
    sections.push(
      `Private OOC · DM context for this player (DM-only; not character speech or public table knowledge):\n${input.privateOoc}`,
    );
  }
  if (input.campaign) {
    sections.push(`Shared campaign table:\n${input.campaign}`);
  }

  return sections.join("\n\n");
}
