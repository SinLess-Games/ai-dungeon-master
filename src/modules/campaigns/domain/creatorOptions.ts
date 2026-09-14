export interface CampaignStyleOption {
  id: string;
  name: string;
  description: string;
}

export const CAMPAIGN_STYLE_LIMIT = 5;

export const campaignStyleOptions = [
  { id: "high-fantasy", name: "High Fantasy", description: "Grand magic, legendary realms, and world-shaping threats." },
  { id: "low-fantasy", name: "Low Fantasy", description: "Grounded adventures where magic is rarer and more mysterious." },
  { id: "dark-fantasy", name: "Dark Fantasy", description: "Bleak worlds, dangerous magic, and hard-won victories." },
  { id: "grimdark", name: "Grimdark", description: "Brutal stakes, moral compromise, and a world that does not play fair." },
  { id: "heroic-fantasy", name: "Heroic Fantasy", description: "Bold heroes, clear dangers, and larger-than-life deeds." },
  { id: "sword-and-sorcery", name: "Sword & Sorcery", description: "Personal stakes, dangerous ruins, and volatile magic." },
  { id: "gothic-horror", name: "Gothic Horror", description: "Cursed bloodlines, haunted estates, and creeping dread." },
  { id: "cosmic-horror", name: "Cosmic Horror", description: "Forbidden truths, alien powers, and threats beyond mortal scale." },
  { id: "survival", name: "Survival", description: "Scarce resources, harsh travel, and staying alive against the odds." },
  { id: "exploration", name: "Exploration", description: "Unknown frontiers, lost places, and discovery-driven play." },
  { id: "mystery", name: "Mystery", description: "Clues, secrets, investigations, and revelations." },
  { id: "political-intrigue", name: "Political Intrigue", description: "Courtly schemes, alliances, leverage, and betrayal." },
  { id: "espionage", name: "Espionage", description: "Covert missions, infiltration, secrets, and double agents." },
  { id: "war", name: "War", description: "Campaigns shaped by armies, fronts, sieges, and changing borders." },
  { id: "military", name: "Military", description: "A disciplined campaign focused on missions, command, and unit life." },
  { id: "monster-hunting", name: "Monster Hunting", description: "Track, study, prepare for, and defeat dangerous creatures." },
  { id: "dungeon-crawl", name: "Dungeon Crawl", description: "Traps, treasure, tactical rooms, and dangerous delves." },
  { id: "megadungeon", name: "Megadungeon", description: "A vast dungeon complex intended to sustain an entire campaign." },
  { id: "hexcrawl", name: "Hexcrawl", description: "Player-directed wilderness travel across a mapped frontier." },
  { id: "west-marches", name: "West Marches", description: "Open-table expeditions into a persistent dangerous frontier." },
  { id: "urban", name: "Urban", description: "City districts, factions, crime, politics, and dense social play." },
  { id: "wilderness", name: "Wilderness", description: "Remote landscapes, travel hazards, and untamed regions." },
  { id: "seafaring", name: "Seafaring", description: "Ships, islands, naval travel, and dangers beyond the shore." },
  { id: "pirates", name: "Pirates", description: "Plunder, rival crews, hidden treasure, and life beyond the law." },
  { id: "planar", name: "Planar", description: "Travel between planes, strange realities, and cosmic factions." },
  { id: "steampunk", name: "Steampunk", description: "Arcane industry, strange machines, smoke, brass, and invention." },
  { id: "post-apocalyptic", name: "Post-Apocalyptic", description: "Civilization after catastrophe, ruins, scarcity, and rebuilding." },
  { id: "mythic", name: "Mythic", description: "Godlike deeds, ancient prophecy, and heroes who reshape history." },
  { id: "noir", name: "Noir", description: "Moral ambiguity, dangerous secrets, and hard-edged investigation." },
  { id: "comedy", name: "Comedy", description: "A lighter campaign where absurdity and humor share the spotlight." },
] as const satisfies readonly CampaignStyleOption[];

export type CampaignStyleId = (typeof campaignStyleOptions)[number]["id"];

export const campaignPaceOptions = [
  { id: "slow", name: "Slow", description: "Deep roleplay, downtime, and long-form story arcs." },
  { id: "moderate", name: "Moderate", description: "A balanced mix of roleplay, exploration, and action." },
  { id: "fast", name: "Fast", description: "Action-forward play with quick progression and frequent turning points." },
] as const;

export type CampaignPace = (typeof campaignPaceOptions)[number]["id"];

export const campaignScaleOptions = [
  { id: "heroic", name: "Heroic", levelRange: "1–10", description: "Local and regional heroes facing dangerous but grounded stakes." },
  { id: "paragon", name: "Paragon", levelRange: "11–20", description: "Seasoned heroes whose choices affect kingdoms and nations." },
  { id: "epic", name: "Epic", levelRange: "21+", description: "Legends among legends, with worlds and planes at stake." },
] as const;

export type CampaignScale = (typeof campaignScaleOptions)[number]["id"];

export const campaignStructureOptions = [
  { id: "open-world", name: "Open World (Sandbox)" },
  { id: "story-arc", name: "Story Arc" },
  { id: "episodic", name: "Episodic" },
  { id: "dungeon-crawl", name: "Dungeon Crawl" },
  { id: "hexcrawl", name: "Hexcrawl" },
  { id: "west-marches", name: "West Marches" },
  { id: "city-campaign", name: "City Campaign" },
  { id: "war-campaign", name: "War Campaign" },
] as const;

export type CampaignStructure = (typeof campaignStructureOptions)[number]["id"];

export const worldTemplateOptions = [
  { id: "balanced-realms", name: "Balanced Realms", description: "A broad mix of settlements, wilderness, ruins, factions, and roads." },
  { id: "dangerous-frontier", name: "Dangerous Frontier", description: "Sparse civilization surrounded by wilderness, ruins, and unexplored territory." },
  { id: "fractured-kingdoms", name: "Fractured Kingdoms", description: "Rival realms, disputed borders, politics, warfare, and shifting alliances." },
  { id: "ancient-ruins", name: "Age of Ruins", description: "A world layered over fallen civilizations, forgotten roads, and buried powers." },
  { id: "wild-magic", name: "Wild Magic", description: "Unstable magical regions and supernatural events shape travel and settlement life." },
  { id: "isles-and-seas", name: "Isles & Seas", description: "Coasts, archipelagos, trade routes, naval travel, and isolated cultures." },
] as const;

export type WorldTemplateId = (typeof worldTemplateOptions)[number]["id"];
export type WorldCreationMode = "generated" | "seeded";

export const levelingModeOptions = [
  { id: "experience", name: "Experience Points", description: "Use D&D 3.5 XP progression and level thresholds." },
  { id: "milestone", name: "Milestone", description: "The campaign advances characters at major story milestones." },
] as const;
export type LevelingMode = (typeof levelingModeOptions)[number]["id"];

export const characterProgressionOptions = [
  { id: "standard", name: "Standard", description: "Normal D&D 3.5 class progression." },
  { id: "gestalt", name: "Gestalt", description: "Characters advance in two classes at each character level." },
  { id: "player-choice", name: "Player Choice", description: "Allow each player to choose standard or gestalt creation." },
] as const;
export type CharacterProgressionPolicy = (typeof characterProgressionOptions)[number]["id"];

export const campaignDifficultyOptions = [
  { id: "forgiving", name: "Forgiving", description: "Lower pressure and more recovery opportunities." },
  { id: "balanced", name: "Balanced", description: "Fair consequences with dangerous encounters when earned." },
  { id: "challenging", name: "Challenging", description: "Resources matter and poor choices can become costly." },
  { id: "brutal", name: "Brutal", description: "Lethal stakes, scarce safety, and enemies that exploit mistakes." },
] as const;
export type CampaignDifficulty = (typeof campaignDifficultyOptions)[number]["id"];

export const rulesStrictnessOptions = [
  { id: "strict", name: "Rules Strict", description: "Prefer rules-as-written and deterministic adjudication." },
  { id: "balanced", name: "Balanced", description: "Keep the rules authoritative while allowing sensible rulings." },
  { id: "cinematic", name: "Cinematic", description: "Favor dramatic rulings when the rules leave room for interpretation." },
] as const;
export type RulesStrictness = (typeof rulesStrictnessOptions)[number]["id"];

export const dmCreativityOptions = [
  { id: "conservative", name: "Conservative", description: "Stay close to established lore, locations, and campaign facts." },
  { id: "adaptive", name: "Adaptive", description: "Add new details when needed while protecting continuity." },
  { id: "inventive", name: "Inventive", description: "Create more unexpected NPCs, hooks, complications, and discoveries." },
] as const;
export type DmCreativity = (typeof dmCreativityOptions)[number]["id"];

export const contentPolicyOptions = [
  { id: "core", name: "Core Only", description: "Use the core D&D 3.5 rules and content set." },
  { id: "official", name: "Official 3.5", description: "Allow enabled official D&D 3.5 supplements in addition to core." },
  { id: "custom", name: "Custom", description: "Allow official content plus enabled homebrew or custom sources." },
] as const;
export type ContentPolicy = (typeof contentPolicyOptions)[number]["id"];

export const campaignStyleIds = new Set<string>(campaignStyleOptions.map((option) => option.id));
export const campaignPaceIds = new Set<string>(campaignPaceOptions.map((option) => option.id));
export const campaignScaleIds = new Set<string>(campaignScaleOptions.map((option) => option.id));
export const campaignStructureIds = new Set<string>(campaignStructureOptions.map((option) => option.id));
export const worldTemplateIds = new Set<string>(worldTemplateOptions.map((option) => option.id));
export const levelingModeIds = new Set<string>(levelingModeOptions.map((option) => option.id));
export const characterProgressionIds = new Set<string>(characterProgressionOptions.map((option) => option.id));
export const campaignDifficultyIds = new Set<string>(campaignDifficultyOptions.map((option) => option.id));
export const rulesStrictnessIds = new Set<string>(rulesStrictnessOptions.map((option) => option.id));
export const dmCreativityIds = new Set<string>(dmCreativityOptions.map((option) => option.id));
export const contentPolicyIds = new Set<string>(contentPolicyOptions.map((option) => option.id));
