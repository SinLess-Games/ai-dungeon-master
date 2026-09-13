-- Deities and Demigods Appendix 1 domains.
-- Domain definitions originate in the 2002 book; spell lists are revised separately by the official 3.5 accessory update.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,power) AS (VALUES
  ('artifice','Artifice','Gain +4 on Craft checks and cast conjuration (creation) spells at +1 caster level. If the caster has both Artifice and Creation, the combined bonus for conjuration (creation) spells is +3 caster levels.'),
  ('charm','Charm','Once per day as a free action, increase Charisma by 4 for 1 minute.'),
  ('community','Community','Once per day use calm emotions as a spell-like ability and gain a +2 competence bonus on Diplomacy checks.'),
  ('creation','Creation','Cast conjuration (creation) spells at +2 caster levels. If the caster has both Artifice and Creation, the combined bonus for conjuration (creation) spells is +3 caster levels.'),
  ('darkness','Darkness','Gain Blind-Fight as a bonus feat.'),
  ('glory','Glory','When turning undead, gain +2 on the turning check and +1d6 on turning damage.'),
  ('liberation','Liberation','Gain a +2 morale bonus on saving throws against enchantment spells and effects.'),
  ('madness','Madness','Gain an Insanity score equal to half the relevant divine-class levels. Add it to Wisdom for spellcasting but subtract it from Wisdom for other purposes; once per day apply Insanity positively to one Wisdom-based roll instead.'),
  ('nobility','Nobility','Once per day inspire allies who can hear you, granting +2 morale on saves, attacks, ability checks, skill checks, and weapon damage for rounds equal to Charisma bonus.'),
  ('repose','Repose','Once per day make a death touch: after a successful melee touch, roll 1d6 per cleric level; if the total equals or exceeds the living target''s current hit points, it dies. This good-aligned alternative to Death does not grant evil spells.'),
  ('rune','Rune','Gain Scribe Scroll as a bonus feat.'),
  ('scalykind','Scalykind','Rebuke or command reptilian animals and snakes as an evil cleric rebukes or commands undead, usable 3 + Charisma modifier times per day.'),
  ('weather','Weather','Treat the revised equivalents of Intuit Direction and Wilderness Lore functions as class-skill support; for 3.5 play, use Survival for the applicable wilderness/navigation tasks.')
)
INSERT INTO dnd35_domains
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,granted_power_text)
SELECT 'dd-domain-'||d.slug,'dd-3.0','213-215',d.slug,d.name,
       d.name||' domain from Deities and Demigods.',d.power,0,NULL,1,d.power
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_domains x WHERE x.slug=d.slug AND x.owner_user_id IS NULL);
