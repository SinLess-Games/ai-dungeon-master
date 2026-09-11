-- Heroes of Horror: nightmares and dreamscape rules.
-- Source: Heroes of Horror, Chapter 3, pp. 54-58. Mechanical text is summarized; source pages remain authoritative.

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,summary,tags,mechanics) AS (VALUES
('hoh-nightly-nightmares','Nightly Nightmare Consequences','54','dreamscape','subsystem',1,0,
 'Nightmares suffered every night prevent meaningful rest and progressively impose fatigue, exhaustion, and possible depravity.',
 '["horror","dream","nightmare","rest","taint"]',
 '{"frequency_requirement":"nightly","arcane_spell_recovery":false,"fatigue_after_days":"Constitution modifier, minimum 1","exhaustion_after_days":"14 + Constitution modifier, minimum modifier contribution 1","after_exhaustion":{"save":"Will","dc":"10 + 1 per night beyond two weeks","failure":"depravity +1"},"escape_examples":["remove a curse","appease or resolve the entity or cause producing the nightmares"]}'),
('hoh-dreamscape-spell-distortion','Spells in the Dreamscape','57','dreamscape','table',1,0,
 'Spells and spell-like abilities in a nightmare realm can be distorted; higher-level magic is more likely to twist.',
 '["horror","dream","nightmare","magic","wild-magic"]',
 '{"distortion_check":"1d20 + spell level","distorts_on":21,"distortion_roll":"1d20","results":[{"min":1,"max":5,"effect":"spell functions normally but with cosmetic changes"},{"min":6,"max":7,"effect":"spell functions at 1d4 caster levels lower"},{"min":8,"max":9,"effect":"spell functions at 1d4 caster levels higher"},{"min":10,"max":11,"effect":"spell functions normally but affects a randomly determined target or area instead of the intended one"},{"min":12,"max":13,"effect":"intended spell fails and a random spell of the same level is produced; it need not be known or prepared"},{"min":14,"max":15,"effect":"intended spell fails and a random spell 1d4 levels lower is produced; it need not be known or prepared"},{"min":16,"max":17,"effect":"intended spell fails and a random spell 1d4 levels higher is produced; it need not be known or prepared"},{"min":18,"max":19,"effect":"spell fails to materialize"},{"min":20,"max":20,"effect":"roll twice; ignore additional rolls of 20"}]}'),
('hoh-dreamscape-physical-injury','Physical Travel in Nightmare Realms','57','dreamscape','rule',1,0,
 'A character who physically enters the dreamscape is present body and soul, so all injuries are genuine.',
 '["horror","dream","nightmare","injury","planar-travel"]',
 '{"travel_mode":"physical","body_and_soul_present":true,"injury_carries_to_real_body":true,"death_is_real":true}'),
('hoh-dreamscape-mental-injury','Mental or Spiritual Dreamscape Injury','57','dreamscape','subsystem',1,0,
 'For mental or spiritual dream travel, a campaign can either carry wounds across directly or translate dream wounds into mental harm.',
 '["horror","dream","nightmare","injury","variant"]',
 '{"travel_modes":["mental","spiritual"],"simple_option":{"result":"wounds and injuries carry over normally"},"mental_damage_options":[{"method":"ability damage","on_exit":"divide total hit point damage taken in the nightmare realm by character level","damage":"that many total points of Wisdom and Charisma damage, minimum 1, divided as evenly as possible","healed_before_exit":"if any wounds were suffered at all, minimum 1 Charisma damage still applies"},{"method":"depravity save","on_exit":"divide total hit point damage taken in the nightmare realm by character level and add 10","result":"this total is the Will save DC","failure":"depravity +1"}]}'),
('hoh-dreamscape-mental-death','Mental Dreamscape Death','57','dreamscape','guidance',1,0,
 'Choose in advance how death during mental or spiritual dream travel affects the waking character.',
 '["horror","dream","nightmare","death","variant"]',
 '{"choose_before_play":true,"death_options":[{"result":"physical body also dies from mental shock"},{"result":"lose one or two levels"},{"result":"permanent mental ability damage","amount_options":[2,4],"abilities":["Intelligence","Wisdom","Charisma"]}],"real_body_dies_while_dream_self_away":{"result":"dream self becomes permanently trapped in that dream realm","survival":"indefinite","can_leave":false,"if_later_slain_in_dream":"dies and proceeds to appropriate afterlife"}}'),
('hoh-dreamer-awakens','Dreamer Awakens During Dreamscape Travel','57','dreamscape','guidance',1,0,
 'If adventurers are traveling within a particular creature''s dream when that dreamer wakes, the campaign chooses how the realm responds.',
 '["horror","dream","nightmare","travel","variant"]',
 '{"options":[{"result":"travelers instantly return to waking bodies","possible_aftereffect":"stunned, at DM discretion"},{"result":"travelers remain trapped until the dreamer sleeps again"},{"result":"travelers are expelled into the wider dreamscape and must find another route home"},{"result":"the dream realm persists while the dreamer is awake because it is a visited realm rather than a purely created dream"}]}'),
('hoh-nightmare-creature-manifestation','Nightmare Creature Manifestation Variants','58','dreamscape','subsystem',1,0,
 'Nightmare-native creatures can be given special rules connecting their dream existence to the waking world.',
 '["horror","dream","nightmare","monster","variant"]',
 '{"options":[{"rule":"manifest only near a dreaming creature used as a doorway","dreamer_awakened":"creature is driven back to dreamscape"},{"rule":"cannot physically manifest","material_plane_method":"possess bodies of dreaming creatures"},{"rule":"damage dealt in dreams is real physical damage even without true dreamscape travel"},{"rule":"physical-world attacks deal nonlethal damage","enslavement_trigger":"nonlethal damage exceeds target hit point total","result":"mentally enslaved","breaking_spells":["break enchantment","greater restoration"],"breaking_check":"caster level check","breaking_dc":"nightmare creature Hit Dice + 11"}]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'hoh-rule-'||d.slug,'hoh-3.5',d.source_page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       d.category,d.kind,d.is_variant,d.default_enabled,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.slug=d.slug AND r.owner_user_id IS NULL);
