import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { uuid, timestamps, enumCheck, nonEmpty, nonNegative, positive } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { spells } from "./spell";
import { classSpellcasting, classCastingAdvancements } from "./classSpellcasting";
import { characterClassLevels } from "./characterClassLevel";
import { characterInventory } from "./characterInventory";
import { domains } from "./domain";
import { feats } from "./feat";
import { specialAbilities } from "./specialAbility";

/** Known spells, books, and preparations are independent facts. A copied spell
 * need not be known; two books may contain the same spell; each casting track
 * maintains its own access and preparations. No derived slot totals are stored. */
export const characterCastingTracks = sqliteTable(
  "dnd35_character_casting_tracks",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    classSpellcastingId: text("class_spellcasting_id").references(() => classSpellcasting.id, {
      onDelete: "restrict",
    }),
    /** Nonclass access (such as a feat granting a power) needs no invented class. */
    grantedFeatId: text("granted_feat_id").references(() => feats.id, { onDelete: "restrict" }),
    grantedSpecialAbilityId: text("granted_special_ability_id").references(
      () => specialAbilities.id,
      { onDelete: "restrict" },
    ),
    /** Choices such as specialization are IDs of content, validated by the ruleset. */
    specializationKey: text("specialization_key"),
    casterLevelAdjustment: integer("caster_level_adjustment").notNull().default(0),
    manifesterLevelAdjustment: integer("manifester_level_adjustment").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_casting_tracks_caster_level_adjustment_integer",
      sql`${t.casterLevelAdjustment} is null or typeof(${t.casterLevelAdjustment}) = 'integer'`,
    ),
    check(
      "dnd35_character_casting_tracks_manifester_level_adjustment_integer",
      sql`typeof(${t.manifesterLevelAdjustment}) = 'integer'`,
    ),
    check(
      "dnd35_character_casting_tracks_one_source",
      sql`(${t.classSpellcastingId} is not null) + (${t.grantedFeatId} is not null) + (${t.grantedSpecialAbilityId} is not null) = 1`,
    ),
    uniqueIndex("dnd35_character_casting_tracks_definition_uq").on(
      t.characterId,
      t.classSpellcastingId,
    ),
    uniqueIndex("dnd35_character_casting_tracks_owner_uq").on(t.id, t.characterId),
    uniqueIndex("dnd35_character_casting_tracks_feat_uq").on(t.characterId, t.grantedFeatId),
    uniqueIndex("dnd35_character_casting_tracks_ability_uq").on(
      t.characterId,
      t.grantedSpecialAbilityId,
    ),
  ],
);
export type CharacterCastingTrack = typeof characterCastingTracks.$inferSelect;
export type NewCharacterCastingTrack = typeof characterCastingTracks.$inferInsert;
export const characterCastingAdvancements = sqliteTable(
  "dnd35_character_casting_advancements",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    advancementId: text("advancement_id")
      .notNull()
      .references(() => classCastingAdvancements.id, { onDelete: "restrict" }),
    characterClassLevelId: text("character_class_level_id").notNull(),
    castingTrackId: text("casting_track_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.characterId, t.advancementId] }),
    foreignKey({
      columns: [t.characterClassLevelId, t.characterId],
      foreignColumns: [characterClassLevels.id, characterClassLevels.characterId],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.castingTrackId, t.characterId],
      foreignColumns: [characterCastingTracks.id, characterCastingTracks.characterId],
    }).onDelete("cascade"),
    index("dnd35_character_casting_advancements_track_idx").on(t.castingTrackId),
  ],
);
export type CharacterCastingAdvancement = typeof characterCastingAdvancements.$inferSelect;
export type NewCharacterCastingAdvancement = typeof characterCastingAdvancements.$inferInsert;
export const characterSpells = sqliteTable(
  "dnd35_character_spells",
  {
    castingTrackId: text("casting_track_id")
      .notNull()
      .references(() => characterCastingTracks.id, { onDelete: "cascade" }),
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "restrict" }),
    accessKind: text("access_kind", { enum: ["known", "granted"] })
      .notNull()
      .default("known"),
    gainedAtLevel: integer("gained_at_level"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_spells_gained_at_level_integer",
      sql`${t.gainedAtLevel} is null or typeof(${t.gainedAtLevel}) = 'integer'`,
    ),
    primaryKey({ columns: [t.castingTrackId, t.spellId] }),
    enumCheck("dnd35_character_spells_access_valid", t.accessKind, ["known", "granted"]),
    positive("dnd35_character_spells_level_valid", t.gainedAtLevel),
  ],
);
export type CharacterSpell = typeof characterSpells.$inferSelect;
export type NewCharacterSpell = typeof characterSpells.$inferInsert;
export const characterSpellbooks = sqliteTable(
  "dnd35_character_spellbooks",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    inventoryId: text("inventory_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("dnd35_character_spellbooks_inventory_uq")
      .on(t.inventoryId)
      .where(sql`${t.inventoryId} is not null`),
    index("dnd35_character_spellbooks_character_idx").on(t.characterId),
    foreignKey({
      columns: [t.inventoryId, t.characterId],
      foreignColumns: [characterInventory.id, characterInventory.characterId],
    }).onDelete("cascade"),
    nonEmpty("dnd35_character_spellbooks_name_nonempty", t.name),
  ],
);
export type CharacterSpellbook = typeof characterSpellbooks.$inferSelect;
export type NewCharacterSpellbook = typeof characterSpellbooks.$inferInsert;
export const characterSpellbookSpells = sqliteTable(
  "dnd35_character_spellbook_spells",
  {
    spellbookId: text("spellbook_id")
      .notNull()
      .references(() => characterSpellbooks.id, { onDelete: "cascade" }),
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "restrict" }),
    pages: integer("pages"),
    copiedAt: integer("copied_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    check(
      "dnd35_character_spellbook_spells_pages_integer",
      sql`${t.pages} is null or typeof(${t.pages}) = 'integer'`,
    ),
    check(
      "dnd35_character_spellbook_spells_copied_at_integer",
      sql`${t.copiedAt} is null or typeof(${t.copiedAt}) = 'integer'`,
    ),
    primaryKey({ columns: [t.spellbookId, t.spellId] }),
    positive("dnd35_character_spellbook_spells_pages_valid", t.pages),
  ],
);
export type CharacterSpellbookSpell = typeof characterSpellbookSpells.$inferSelect;
export type NewCharacterSpellbookSpell = typeof characterSpellbookSpells.$inferInsert;
export const characterSpellPreparations = sqliteTable(
  "dnd35_character_spell_preparations",
  {
    id: uuid(),
    castingTrackId: text("casting_track_id")
      .notNull()
      .references(() => characterCastingTracks.id, { onDelete: "cascade" }),
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "restrict" }),
    domainId: text("domain_id").references(() => domains.id, { onDelete: "restrict" }),
    /** May exceed 9 for epic metamagic slots; spell definitions retain 0–9 levels. */
    slotLevel: integer("slot_level").notNull(),
    preparedCount: integer("prepared_count").notNull().default(1),
    expendedCount: integer("expended_count").notNull().default(0),
    preparationKey: text("preparation_key").notNull().default("default"),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_spell_preparations_slot_level_integer",
      sql`${t.slotLevel} is null or typeof(${t.slotLevel}) = 'integer'`,
    ),
    check(
      "dnd35_character_spell_preparations_prepared_count_integer",
      sql`${t.preparedCount} is null or typeof(${t.preparedCount}) = 'integer'`,
    ),
    check(
      "dnd35_character_spell_preparations_expended_count_integer",
      sql`${t.expendedCount} is null or typeof(${t.expendedCount}) = 'integer'`,
    ),
    index("dnd35_character_preparations_track_idx").on(t.castingTrackId, t.slotLevel),
    nonNegative("dnd35_character_preparations_slot_valid", t.slotLevel),
    positive("dnd35_character_preparations_count_valid", t.preparedCount),
    nonNegative("dnd35_character_preparations_expended_valid", t.expendedCount),
    check(
      "dnd35_character_preparations_expended_limit",
      sql`${t.expendedCount} <= ${t.preparedCount}`,
    ),
    nonEmpty("dnd35_character_preparations_key_nonempty", t.preparationKey),
  ],
);
export type CharacterSpellPreparation = typeof characterSpellPreparations.$inferSelect;
export type NewCharacterSpellPreparation = typeof characterSpellPreparations.$inferInsert;
export const characterPreparationMetamagic = sqliteTable(
  "dnd35_character_preparation_metamagic",
  {
    preparationId: text("preparation_id")
      .notNull()
      .references(() => characterSpellPreparations.id, { onDelete: "cascade" }),
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "restrict" }),
    applications: integer("applications").notNull().default(1),
  },
  (t) => [
    check(
      "dnd35_character_preparation_metamagic_applications_integer",
      sql`${t.applications} is null or typeof(${t.applications}) = 'integer'`,
    ),
    primaryKey({ columns: [t.preparationId, t.featId] }),
    positive("dnd35_preparation_metamagic_applications_valid", t.applications),
  ],
);
export type CharacterPreparationMetamagic = typeof characterPreparationMetamagic.$inferSelect;
export type NewCharacterPreparationMetamagic = typeof characterPreparationMetamagic.$inferInsert;
