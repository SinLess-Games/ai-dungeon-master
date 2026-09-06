CREATE TABLE `bug_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`steps_to_reproduce` text,
	`expected_behavior` text,
	`actual_behavior` text,
	`severity` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`platform` text DEFAULT 'unknown' NOT NULL,
	`context` text,
	`internal_notes` text,
	`resolution` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`resolved_at` integer,
	CONSTRAINT "bug_reports_title_not_empty" CHECK(length(trim("bug_reports"."title")) > 0),
	CONSTRAINT "bug_reports_description_not_empty" CHECK(length(trim("bug_reports"."description")) > 0),
	CONSTRAINT "bug_reports_severity_valid" CHECK("bug_reports"."severity" IN ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "bug_reports_status_valid" CHECK("bug_reports"."status" IN (
        'open',
        'triaged',
        'in_progress',
        'resolved',
        'closed',
        'duplicate',
        'wont_fix'
      )),
	CONSTRAINT "bug_reports_platform_valid" CHECK("bug_reports"."platform" IN (
        'web',
        'android',
        'windows',
        'api',
        'unknown'
      ))
);
--> statement-breakpoint
CREATE INDEX `bug_reports_reporter_user_id_idx` ON `bug_reports` (`reporter_user_id`);--> statement-breakpoint
CREATE INDEX `bug_reports_status_idx` ON `bug_reports` (`status`);--> statement-breakpoint
CREATE INDEX `bug_reports_severity_idx` ON `bug_reports` (`severity`);--> statement-breakpoint
CREATE INDEX `bug_reports_created_at_idx` ON `bug_reports` (`created_at`);--> statement-breakpoint
CREATE INDEX `bug_reports_status_created_at_idx` ON `bug_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `feature_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_user_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`problem` text,
	`proposed_solution` text,
	`category` text DEFAULT 'other' NOT NULL,
	`impact` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`platform` text DEFAULT 'unknown' NOT NULL,
	`vote_count` integer DEFAULT 0 NOT NULL,
	`context` text,
	`internal_notes` text,
	`resolution` text,
	`duplicate_of_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	CONSTRAINT "feature_requests_title_not_empty" CHECK(length(trim("feature_requests"."title")) > 0),
	CONSTRAINT "feature_requests_description_not_empty" CHECK(length(trim("feature_requests"."description")) > 0),
	CONSTRAINT "feature_requests_vote_count_non_negative" CHECK("feature_requests"."vote_count" >= 0),
	CONSTRAINT "feature_requests_category_valid" CHECK("feature_requests"."category" IN (
        'gameplay',
        'ai',
        'rules',
        'maps',
        'multiplayer',
        'characters',
        'worlds',
        'campaigns',
        'content',
        'ui',
        'mobile',
        'desktop',
        'billing',
        'account',
        'performance',
        'accessibility',
        'other'
      )),
	CONSTRAINT "feature_requests_impact_valid" CHECK("feature_requests"."impact" IN (
        'low',
        'medium',
        'high',
        'critical'
      )),
	CONSTRAINT "feature_requests_status_valid" CHECK("feature_requests"."status" IN (
        'submitted',
        'under_review',
        'planned',
        'in_progress',
        'completed',
        'declined',
        'duplicate'
      )),
	CONSTRAINT "feature_requests_platform_valid" CHECK("feature_requests"."platform" IN (
        'web',
        'android',
        'windows',
        'cross_platform',
        'api',
        'unknown'
      ))
);
--> statement-breakpoint
CREATE INDEX `feature_requests_requester_user_id_idx` ON `feature_requests` (`requester_user_id`);--> statement-breakpoint
CREATE INDEX `feature_requests_status_idx` ON `feature_requests` (`status`);--> statement-breakpoint
CREATE INDEX `feature_requests_category_idx` ON `feature_requests` (`category`);--> statement-breakpoint
CREATE INDEX `feature_requests_impact_idx` ON `feature_requests` (`impact`);--> statement-breakpoint
CREATE INDEX `feature_requests_created_at_idx` ON `feature_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `feature_requests_status_created_at_idx` ON `feature_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `feature_requests_category_status_idx` ON `feature_requests` (`category`,`status`);--> statement-breakpoint
CREATE INDEX `feature_requests_duplicate_of_id_idx` ON `feature_requests` (`duplicate_of_id`);--> statement-breakpoint
CREATE TABLE `dnd35_ammunition` (
	`item_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`quantity_per_package` integer DEFAULT 1 NOT NULL,
	`special_text` text,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_ammunition_quantity_per_package_integer" CHECK("dnd35_ammunition"."quantity_per_package" is null or typeof("dnd35_ammunition"."quantity_per_package") = 'integer'),
	CONSTRAINT "dnd35_ammunition_kind_nonempty" CHECK(length(trim("dnd35_ammunition"."kind")) > 0),
	CONSTRAINT "dnd35_ammunition_package_valid" CHECK("dnd35_ammunition"."quantity_per_package" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_ammunition_weapons` (
	`ammunition_id` text NOT NULL,
	`weapon_id` text NOT NULL,
	PRIMARY KEY(`ammunition_id`, `weapon_id`),
	FOREIGN KEY (`ammunition_id`) REFERENCES `dnd35_ammunition`(`item_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`weapon_id`) REFERENCES `dnd35_weapons`(`item_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_ammunition_weapons_reverse_idx` ON `dnd35_ammunition_weapons` (`weapon_id`);--> statement-breakpoint
CREATE TABLE `dnd35_armors` (
	`item_id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`ac_bonus` integer NOT NULL,
	`max_dex_bonus` integer,
	`armor_check_penalty` integer DEFAULT 0 NOT NULL,
	`arcane_spell_failure_percent` integer DEFAULT 0 NOT NULL,
	`speed_at_30_feet` integer,
	`speed_at_20_feet` integer,
	`special_text` text,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_armors_ac_bonus_integer" CHECK("dnd35_armors"."ac_bonus" is null or typeof("dnd35_armors"."ac_bonus") = 'integer'),
	CONSTRAINT "dnd35_armors_max_dex_bonus_integer" CHECK("dnd35_armors"."max_dex_bonus" is null or typeof("dnd35_armors"."max_dex_bonus") = 'integer'),
	CONSTRAINT "dnd35_armors_armor_check_penalty_integer" CHECK("dnd35_armors"."armor_check_penalty" is null or typeof("dnd35_armors"."armor_check_penalty") = 'integer'),
	CONSTRAINT "dnd35_armors_arcane_spell_failure_percent_integer" CHECK("dnd35_armors"."arcane_spell_failure_percent" is null or typeof("dnd35_armors"."arcane_spell_failure_percent") = 'integer'),
	CONSTRAINT "dnd35_armors_speed_at_30_feet_integer" CHECK("dnd35_armors"."speed_at_30_feet" is null or typeof("dnd35_armors"."speed_at_30_feet") = 'integer'),
	CONSTRAINT "dnd35_armors_speed_at_20_feet_integer" CHECK("dnd35_armors"."speed_at_20_feet" is null or typeof("dnd35_armors"."speed_at_20_feet") = 'integer'),
	CONSTRAINT "dnd35_armors_category_valid" CHECK("dnd35_armors"."category" in ('light', 'medium', 'heavy')),
	CONSTRAINT "dnd35_armors_ac_valid" CHECK("dnd35_armors"."ac_bonus" >= 0),
	CONSTRAINT "dnd35_armors_dex_valid" CHECK("dnd35_armors"."max_dex_bonus" >= 0),
	CONSTRAINT "dnd35_armors_penalty_valid" CHECK("dnd35_armors"."armor_check_penalty" <= 0),
	CONSTRAINT "dnd35_armors_failure_valid" CHECK("dnd35_armors"."arcane_spell_failure_percent" between 0 and 100),
	CONSTRAINT "dnd35_armors_speed30_valid" CHECK("dnd35_armors"."speed_at_30_feet" >= 0),
	CONSTRAINT "dnd35_armors_speed20_valid" CHECK("dnd35_armors"."speed_at_20_feet" >= 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_domains` (
	`character_id` text NOT NULL,
	`domain_id` text NOT NULL,
	PRIMARY KEY(`character_id`, `domain_id`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `dnd35_domains`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_languages` (
	`character_id` text NOT NULL,
	`language_id` text NOT NULL,
	PRIMARY KEY(`character_id`, `language_id`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`language_id`) REFERENCES `dnd35_languages`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_templates` (
	`character_id` text NOT NULL,
	`template_id` text NOT NULL,
	`application_order` integer NOT NULL,
	PRIMARY KEY(`character_id`, `template_id`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `dnd35_templates`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_templates_application_order_integer" CHECK("dnd35_character_templates"."application_order" is null or typeof("dnd35_character_templates"."application_order") = 'integer'),
	CONSTRAINT "dnd35_character_templates_order_valid" CHECK("dnd35_character_templates"."application_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_templates_order_uq` ON `dnd35_character_templates` (`character_id`,`application_order`);--> statement-breakpoint
CREATE TABLE `dnd35_characters` (
	`character_id` text PRIMARY KEY NOT NULL,
	`race_id` text,
	`deity_id` text,
	`experience_points` integer DEFAULT 0 NOT NULL,
	`alignment` text DEFAULT 'N' NOT NULL,
	`size_override` text,
	`level_adjustment_override` integer,
	`current_hit_points` integer DEFAULT 0 NOT NULL,
	`temporary_hit_points` integer DEFAULT 0 NOT NULL,
	`nonlethal_damage` integer DEFAULT 0 NOT NULL,
	`power_points_spent` integer DEFAULT 0 NOT NULL,
	`progression_mode` text DEFAULT 'standard' NOT NULL,
	`encumbrance_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`deity_id`) REFERENCES `dnd35_deities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_characters_experience_points_integer" CHECK("dnd35_characters"."experience_points" is null or typeof("dnd35_characters"."experience_points") = 'integer'),
	CONSTRAINT "dnd35_characters_level_adjustment_override_integer" CHECK("dnd35_characters"."level_adjustment_override" is null or typeof("dnd35_characters"."level_adjustment_override") = 'integer'),
	CONSTRAINT "dnd35_characters_current_hit_points_integer" CHECK("dnd35_characters"."current_hit_points" is null or typeof("dnd35_characters"."current_hit_points") = 'integer'),
	CONSTRAINT "dnd35_characters_temporary_hit_points_integer" CHECK("dnd35_characters"."temporary_hit_points" is null or typeof("dnd35_characters"."temporary_hit_points") = 'integer'),
	CONSTRAINT "dnd35_characters_nonlethal_damage_integer" CHECK("dnd35_characters"."nonlethal_damage" is null or typeof("dnd35_characters"."nonlethal_damage") = 'integer'),
	CONSTRAINT "dnd35_characters_power_points_spent_integer" CHECK("dnd35_characters"."power_points_spent" is null or typeof("dnd35_characters"."power_points_spent") = 'integer'),
	CONSTRAINT "dnd35_characters_encumbrance_enabled_integer" CHECK("dnd35_characters"."encumbrance_enabled" is null or typeof("dnd35_characters"."encumbrance_enabled") = 'integer'),
	CONSTRAINT "dnd35_characters_id_nonempty" CHECK(length(trim("dnd35_characters"."character_id")) > 0),
	CONSTRAINT "dnd35_characters_xp_valid" CHECK("dnd35_characters"."experience_points" >= 0),
	CONSTRAINT "dnd35_characters_alignment_valid" CHECK("dnd35_characters"."alignment" in ('LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE')),
	CONSTRAINT "dnd35_characters_size_valid" CHECK("dnd35_characters"."size_override" in ('fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal')),
	CONSTRAINT "dnd35_characters_la_valid" CHECK("dnd35_characters"."level_adjustment_override" >= 0),
	CONSTRAINT "dnd35_characters_temp_hp_valid" CHECK("dnd35_characters"."temporary_hit_points" >= 0),
	CONSTRAINT "dnd35_characters_nonlethal_valid" CHECK("dnd35_characters"."nonlethal_damage" >= 0),
	CONSTRAINT "dnd35_characters_pp_valid" CHECK("dnd35_characters"."power_points_spent" >= 0),
	CONSTRAINT "dnd35_characters_progression_valid" CHECK("dnd35_characters"."progression_mode" in ('standard', 'gestalt')),
	CONSTRAINT "dnd35_characters_encumbrance_bool" CHECK("dnd35_characters"."encumbrance_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE INDEX `dnd35_characters_race_idx` ON `dnd35_characters` (`race_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_ability_scores` (
	`character_id` text NOT NULL,
	`ability` text NOT NULL,
	`base_score` integer,
	`inherent_bonus` integer DEFAULT 0 NOT NULL,
	`ability_damage` integer DEFAULT 0 NOT NULL,
	`ability_drain` integer DEFAULT 0 NOT NULL,
	`temporary_adjustment` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `ability`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_character_ability_scores_base_score_integer" CHECK("dnd35_character_ability_scores"."base_score" is null or typeof("dnd35_character_ability_scores"."base_score") = 'integer'),
	CONSTRAINT "dnd35_character_ability_scores_inherent_bonus_integer" CHECK("dnd35_character_ability_scores"."inherent_bonus" is null or typeof("dnd35_character_ability_scores"."inherent_bonus") = 'integer'),
	CONSTRAINT "dnd35_character_ability_scores_ability_damage_integer" CHECK("dnd35_character_ability_scores"."ability_damage" is null or typeof("dnd35_character_ability_scores"."ability_damage") = 'integer'),
	CONSTRAINT "dnd35_character_ability_scores_ability_drain_integer" CHECK("dnd35_character_ability_scores"."ability_drain" is null or typeof("dnd35_character_ability_scores"."ability_drain") = 'integer'),
	CONSTRAINT "dnd35_character_ability_scores_temporary_adjustment_integer" CHECK("dnd35_character_ability_scores"."temporary_adjustment" is null or typeof("dnd35_character_ability_scores"."temporary_adjustment") = 'integer'),
	CONSTRAINT "dnd35_character_ability_scores_key_valid" CHECK("dnd35_character_ability_scores"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
	CONSTRAINT "dnd35_character_ability_scores_base_valid" CHECK("dnd35_character_ability_scores"."base_score" >= 0),
	CONSTRAINT "dnd35_character_ability_scores_inherent_valid" CHECK("dnd35_character_ability_scores"."inherent_bonus" >= 0),
	CONSTRAINT "dnd35_character_ability_scores_damage_valid" CHECK("dnd35_character_ability_scores"."ability_damage" >= 0),
	CONSTRAINT "dnd35_character_ability_scores_drain_valid" CHECK("dnd35_character_ability_scores"."ability_drain" >= 0),
	CONSTRAINT "dnd35_character_ability_scores_nonability_valid" CHECK("dnd35_character_ability_scores"."base_score" is not null or ("dnd35_character_ability_scores"."inherent_bonus" = 0 and "dnd35_character_ability_scores"."ability_damage" = 0 and "dnd35_character_ability_scores"."ability_drain" = 0 and "dnd35_character_ability_scores"."temporary_adjustment" = 0))
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_ability_increases` (
	`character_id` text NOT NULL,
	`character_level` integer NOT NULL,
	`ability` text NOT NULL,
	`amount` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`character_id`, `character_level`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_character_ability_increases_character_level_integer" CHECK("dnd35_character_ability_increases"."character_level" is null or typeof("dnd35_character_ability_increases"."character_level") = 'integer'),
	CONSTRAINT "dnd35_character_ability_increases_amount_integer" CHECK("dnd35_character_ability_increases"."amount" is null or typeof("dnd35_character_ability_increases"."amount") = 'integer'),
	CONSTRAINT "dnd35_character_increases_level_valid" CHECK("dnd35_character_ability_increases"."character_level" > 0),
	CONSTRAINT "dnd35_character_increases_ability_valid" CHECK("dnd35_character_ability_increases"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
	CONSTRAINT "dnd35_character_increases_amount_valid" CHECK("dnd35_character_ability_increases"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_class_levels` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`class_level_id` text NOT NULL,
	`character_level` integer NOT NULL,
	`track` integer DEFAULT 1 NOT NULL,
	`hit_points_gained` integer NOT NULL,
	`skill_points_spent` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_level_id`) REFERENCES `dnd35_class_levels`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_class_levels_character_level_integer" CHECK("dnd35_character_class_levels"."character_level" is null or typeof("dnd35_character_class_levels"."character_level") = 'integer'),
	CONSTRAINT "dnd35_character_class_levels_track_integer" CHECK("dnd35_character_class_levels"."track" is null or typeof("dnd35_character_class_levels"."track") = 'integer'),
	CONSTRAINT "dnd35_character_class_levels_hit_points_gained_integer" CHECK("dnd35_character_class_levels"."hit_points_gained" is null or typeof("dnd35_character_class_levels"."hit_points_gained") = 'integer'),
	CONSTRAINT "dnd35_character_class_levels_skill_points_spent_integer" CHECK("dnd35_character_class_levels"."skill_points_spent" is null or typeof("dnd35_character_class_levels"."skill_points_spent") = 'integer'),
	CONSTRAINT "dnd35_character_class_levels_level_valid" CHECK("dnd35_character_class_levels"."character_level" > 0),
	CONSTRAINT "dnd35_character_class_levels_track_valid" CHECK("dnd35_character_class_levels"."track" in (1, 2)),
	CONSTRAINT "dnd35_character_class_levels_hp_valid" CHECK("dnd35_character_class_levels"."hit_points_gained" > 0),
	CONSTRAINT "dnd35_character_class_levels_skills_valid" CHECK("dnd35_character_class_levels"."skill_points_spent" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_class_levels_order_uq` ON `dnd35_character_class_levels` (`character_id`,`track`,`character_level`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_class_levels_class_step_uq` ON `dnd35_character_class_levels` (`character_id`,`track`,`class_level_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_class_levels_owner_uq` ON `dnd35_character_class_levels` (`id`,`character_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_racial_hit_dice` (
	`character_id` text NOT NULL,
	`creature_type_id` text NOT NULL,
	`character_level` integer NOT NULL,
	`hit_die` integer NOT NULL,
	`hit_points_gained` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `character_level`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creature_type_id`) REFERENCES `dnd35_creature_types`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_racial_hit_dice_character_level_integer" CHECK("dnd35_character_racial_hit_dice"."character_level" is null or typeof("dnd35_character_racial_hit_dice"."character_level") = 'integer'),
	CONSTRAINT "dnd35_character_racial_hit_dice_hit_die_integer" CHECK("dnd35_character_racial_hit_dice"."hit_die" is null or typeof("dnd35_character_racial_hit_dice"."hit_die") = 'integer'),
	CONSTRAINT "dnd35_character_racial_hit_dice_hit_points_gained_integer" CHECK("dnd35_character_racial_hit_dice"."hit_points_gained" is null or typeof("dnd35_character_racial_hit_dice"."hit_points_gained") = 'integer'),
	CONSTRAINT "dnd35_character_rhd_level_valid" CHECK("dnd35_character_racial_hit_dice"."character_level" > 0),
	CONSTRAINT "dnd35_character_rhd_die_valid" CHECK("dnd35_character_racial_hit_dice"."hit_die" > 0),
	CONSTRAINT "dnd35_character_rhd_hp_valid" CHECK("dnd35_character_racial_hit_dice"."hit_points_gained" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`condition_id` text NOT NULL,
	`source_spell_id` text,
	`source_power_id` text,
	`source_character_id` text,
	`encounter_id` text,
	`source_description` text,
	`duration_kind` text NOT NULL,
	`remaining_rounds` integer,
	`expires_at` integer,
	`state` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`condition_id`) REFERENCES `dnd35_conditions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_conditions_remaining_rounds_integer" CHECK("dnd35_character_conditions"."remaining_rounds" is null or typeof("dnd35_character_conditions"."remaining_rounds") = 'integer'),
	CONSTRAINT "dnd35_character_conditions_expires_at_integer" CHECK("dnd35_character_conditions"."expires_at" is null or typeof("dnd35_character_conditions"."expires_at") = 'integer'),
	CONSTRAINT "dnd35_character_conditions_duration_valid" CHECK("dnd35_character_conditions"."duration_kind" in ('rounds', 'until_time', 'permanent', 'concentration', 'special')),
	CONSTRAINT "dnd35_character_conditions_rounds_valid" CHECK("dnd35_character_conditions"."remaining_rounds" >= 0),
	CONSTRAINT "dnd35_character_conditions_state_json" CHECK(case when "dnd35_character_conditions"."state" is null then 1 when json_valid("dnd35_character_conditions"."state") then json_type("dnd35_character_conditions"."state") = 'object' else 0 end),
	CONSTRAINT "dnd35_character_conditions_duration_state_valid" CHECK(
 ("dnd35_character_conditions"."duration_kind" = 'rounds' and "dnd35_character_conditions"."remaining_rounds" is not null and "dnd35_character_conditions"."expires_at" is null) or
 ("dnd35_character_conditions"."duration_kind" = 'until_time' and "dnd35_character_conditions"."expires_at" is not null and "dnd35_character_conditions"."remaining_rounds" is null) or
 ("dnd35_character_conditions"."duration_kind" in ('permanent', 'concentration', 'special') and "dnd35_character_conditions"."expires_at" is null and "dnd35_character_conditions"."remaining_rounds" is null))
);
--> statement-breakpoint
CREATE INDEX `dnd35_character_conditions_character_idx` ON `dnd35_character_conditions` (`character_id`,`condition_id`);--> statement-breakpoint
CREATE INDEX `dnd35_character_conditions_expiry_idx` ON `dnd35_character_conditions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `dnd35_character_feats` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`feat_id` text NOT NULL,
	`occurrence` integer DEFAULT 1 NOT NULL,
	`gained_at_level` integer,
	`grant_kind` text NOT NULL,
	`class_feature_id` text,
	`race_trait_id` text,
	`grant_note` text,
	`choices` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`class_feature_id`) REFERENCES `dnd35_class_features`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`race_trait_id`) REFERENCES `dnd35_race_traits`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_feats_occurrence_integer" CHECK("dnd35_character_feats"."occurrence" is null or typeof("dnd35_character_feats"."occurrence") = 'integer'),
	CONSTRAINT "dnd35_character_feats_gained_at_level_integer" CHECK("dnd35_character_feats"."gained_at_level" is null or typeof("dnd35_character_feats"."gained_at_level") = 'integer'),
	CONSTRAINT "dnd35_character_feats_occurrence_valid" CHECK("dnd35_character_feats"."occurrence" > 0),
	CONSTRAINT "dnd35_character_feats_level_valid" CHECK("dnd35_character_feats"."gained_at_level" > 0),
	CONSTRAINT "dnd35_character_feats_grant_valid" CHECK("dnd35_character_feats"."grant_kind" in ('level', 'class', 'race', 'item', 'dm', 'other')),
	CONSTRAINT "dnd35_character_feats_choices_json" CHECK(case when "dnd35_character_feats"."choices" is null then 1 when json_valid("dnd35_character_feats"."choices") then json_type("dnd35_character_feats"."choices") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_feats_occurrence_uq` ON `dnd35_character_feats` (`character_id`,`feat_id`,`occurrence`);--> statement-breakpoint
CREATE INDEX `dnd35_character_feats_feat_idx` ON `dnd35_character_feats` (`feat_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`item_id` text NOT NULL,
	`instance_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`equipped` integer DEFAULT false NOT NULL,
	`equipped_slot` text,
	`container_inventory_id` text,
	`location` text DEFAULT 'carried' NOT NULL,
	`location_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`instance_id`,`item_id`) REFERENCES `dnd35_item_instances`(`id`,`item_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`container_inventory_id`,`character_id`) REFERENCES `dnd35_character_inventory`(`id`,`character_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "dnd35_character_inventory_quantity_integer" CHECK("dnd35_character_inventory"."quantity" is null or typeof("dnd35_character_inventory"."quantity") = 'integer'),
	CONSTRAINT "dnd35_character_inventory_equipped_integer" CHECK("dnd35_character_inventory"."equipped" is null or typeof("dnd35_character_inventory"."equipped") = 'integer'),
	CONSTRAINT "dnd35_character_inventory_quantity_valid" CHECK("dnd35_character_inventory"."quantity" > 0),
	CONSTRAINT "dnd35_character_inventory_equipped_bool" CHECK("dnd35_character_inventory"."equipped" in (0, 1)),
	CONSTRAINT "dnd35_character_inventory_slot_valid" CHECK("dnd35_character_inventory"."equipped_slot" in ('head', 'face', 'throat', 'shoulders', 'body', 'torso', 'waist', 'arms', 'hands', 'feet', 'ring_left', 'ring_right', 'main_hand', 'off_hand', 'both_hands', 'shield', 'slotless', 'other')),
	CONSTRAINT "dnd35_character_inventory_location_valid" CHECK("dnd35_character_inventory"."location" in ('carried', 'stored', 'party')),
	CONSTRAINT "dnd35_character_inventory_instance_quantity_valid" CHECK("dnd35_character_inventory"."instance_id" is null or "dnd35_character_inventory"."quantity" = 1),
	CONSTRAINT "dnd35_character_inventory_equipped_state_valid" CHECK(("dnd35_character_inventory"."equipped" = 0 and "dnd35_character_inventory"."equipped_slot" is null) or ("dnd35_character_inventory"."equipped" = 1 and "dnd35_character_inventory"."equipped_slot" is not null and "dnd35_character_inventory"."location" = 'carried' and "dnd35_character_inventory"."container_inventory_id" is null)),
	CONSTRAINT "dnd35_character_inventory_container_not_self" CHECK("dnd35_character_inventory"."container_inventory_id" is null or "dnd35_character_inventory"."container_inventory_id" != "dnd35_character_inventory"."id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_inventory_owner_uq` ON `dnd35_character_inventory` (`id`,`character_id`);--> statement-breakpoint
CREATE INDEX `dnd35_character_inventory_character_idx` ON `dnd35_character_inventory` (`character_id`,`equipped`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_inventory_instance_uq` ON `dnd35_character_inventory` (`instance_id`) WHERE "dnd35_character_inventory"."instance_id" is not null;--> statement-breakpoint
CREATE INDEX `dnd35_character_inventory_container_idx` ON `dnd35_character_inventory` (`container_inventory_id`,`character_id`);--> statement-breakpoint
CREATE TABLE `dnd35_item_instance_properties` (
	`instance_id` text NOT NULL,
	`property_id` text NOT NULL,
	`parameters` text,
	PRIMARY KEY(`instance_id`, `property_id`),
	FOREIGN KEY (`instance_id`) REFERENCES `dnd35_item_instances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `dnd35_item_properties`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_instance_properties_parameters_json" CHECK(case when "dnd35_item_instance_properties"."parameters" is null then 1 when json_valid("dnd35_item_instance_properties"."parameters") then json_type("dnd35_item_instance_properties"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_item_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`custom_name` text,
	`remaining_charges` integer,
	`current_hit_points` integer,
	`enhancement_bonus` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_item_instances_remaining_charges_integer" CHECK("dnd35_item_instances"."remaining_charges" is null or typeof("dnd35_item_instances"."remaining_charges") = 'integer'),
	CONSTRAINT "dnd35_item_instances_current_hit_points_integer" CHECK("dnd35_item_instances"."current_hit_points" is null or typeof("dnd35_item_instances"."current_hit_points") = 'integer'),
	CONSTRAINT "dnd35_item_instances_enhancement_bonus_integer" CHECK("dnd35_item_instances"."enhancement_bonus" is null or typeof("dnd35_item_instances"."enhancement_bonus") = 'integer'),
	CONSTRAINT "dnd35_item_instances_charges_valid" CHECK("dnd35_item_instances"."remaining_charges" >= 0),
	CONSTRAINT "dnd35_item_instances_hp_valid" CHECK("dnd35_item_instances"."current_hit_points" >= 0),
	CONSTRAINT "dnd35_item_instances_enhancement_valid" CHECK("dnd35_item_instances"."enhancement_bonus" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_item_instances_definition_uq` ON `dnd35_item_instances` (`id`,`item_id`);--> statement-breakpoint
CREATE INDEX `dnd35_item_instances_item_idx` ON `dnd35_item_instances` (`item_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_powers` (
	`casting_track_id` text NOT NULL,
	`power_id` text NOT NULL,
	`access_kind` text DEFAULT 'known' NOT NULL,
	`gained_at_level` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`casting_track_id`, `power_id`),
	FOREIGN KEY (`casting_track_id`) REFERENCES `dnd35_character_casting_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_powers_gained_at_level_integer" CHECK("dnd35_character_powers"."gained_at_level" is null or typeof("dnd35_character_powers"."gained_at_level") = 'integer'),
	CONSTRAINT "dnd35_character_powers_access_valid" CHECK("dnd35_character_powers"."access_kind" in ('known', 'granted', 'temporary')),
	CONSTRAINT "dnd35_character_powers_level_valid" CHECK("dnd35_character_powers"."gained_at_level" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_skills` (
	`character_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`specialization` text DEFAULT '' NOT NULL,
	`ranks` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`character_id`, `skill_id`, `specialization`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_skills_ranks_valid" CHECK("dnd35_character_skills"."ranks" >= 0 and "dnd35_character_skills"."ranks" * 2 = cast("dnd35_character_skills"."ranks" * 2 as integer))
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_casting_advancements` (
	`character_id` text NOT NULL,
	`advancement_id` text NOT NULL,
	`character_class_level_id` text NOT NULL,
	`casting_track_id` text NOT NULL,
	PRIMARY KEY(`character_id`, `advancement_id`),
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`advancement_id`) REFERENCES `dnd35_class_casting_advancements`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`character_class_level_id`,`character_id`) REFERENCES `dnd35_character_class_levels`(`id`,`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`casting_track_id`,`character_id`) REFERENCES `dnd35_character_casting_tracks`(`id`,`character_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_character_casting_advancements_track_idx` ON `dnd35_character_casting_advancements` (`casting_track_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_casting_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`class_spellcasting_id` text,
	`granted_feat_id` text,
	`granted_special_ability_id` text,
	`specialization_key` text,
	`caster_level_adjustment` integer DEFAULT 0 NOT NULL,
	`manifester_level_adjustment` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_spellcasting_id`) REFERENCES `dnd35_class_spellcasting`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`granted_feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`granted_special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_casting_tracks_caster_level_adjustment_integer" CHECK("dnd35_character_casting_tracks"."caster_level_adjustment" is null or typeof("dnd35_character_casting_tracks"."caster_level_adjustment") = 'integer'),
	CONSTRAINT "dnd35_character_casting_tracks_manifester_level_adjustment_integer" CHECK(typeof("dnd35_character_casting_tracks"."manifester_level_adjustment") = 'integer'),
	CONSTRAINT "dnd35_character_casting_tracks_one_source" CHECK(("dnd35_character_casting_tracks"."class_spellcasting_id" is not null) + ("dnd35_character_casting_tracks"."granted_feat_id" is not null) + ("dnd35_character_casting_tracks"."granted_special_ability_id" is not null) = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_casting_tracks_definition_uq` ON `dnd35_character_casting_tracks` (`character_id`,`class_spellcasting_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_casting_tracks_owner_uq` ON `dnd35_character_casting_tracks` (`id`,`character_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_casting_tracks_feat_uq` ON `dnd35_character_casting_tracks` (`character_id`,`granted_feat_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_casting_tracks_ability_uq` ON `dnd35_character_casting_tracks` (`character_id`,`granted_special_ability_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_preparation_metamagic` (
	`preparation_id` text NOT NULL,
	`feat_id` text NOT NULL,
	`applications` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`preparation_id`, `feat_id`),
	FOREIGN KEY (`preparation_id`) REFERENCES `dnd35_character_spell_preparations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_preparation_metamagic_applications_integer" CHECK("dnd35_character_preparation_metamagic"."applications" is null or typeof("dnd35_character_preparation_metamagic"."applications") = 'integer'),
	CONSTRAINT "dnd35_preparation_metamagic_applications_valid" CHECK("dnd35_character_preparation_metamagic"."applications" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_spell_preparations` (
	`id` text PRIMARY KEY NOT NULL,
	`casting_track_id` text NOT NULL,
	`spell_id` text NOT NULL,
	`domain_id` text,
	`slot_level` integer NOT NULL,
	`prepared_count` integer DEFAULT 1 NOT NULL,
	`expended_count` integer DEFAULT 0 NOT NULL,
	`preparation_key` text DEFAULT 'default' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`casting_track_id`) REFERENCES `dnd35_character_casting_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`domain_id`) REFERENCES `dnd35_domains`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_spell_preparations_slot_level_integer" CHECK("dnd35_character_spell_preparations"."slot_level" is null or typeof("dnd35_character_spell_preparations"."slot_level") = 'integer'),
	CONSTRAINT "dnd35_character_spell_preparations_prepared_count_integer" CHECK("dnd35_character_spell_preparations"."prepared_count" is null or typeof("dnd35_character_spell_preparations"."prepared_count") = 'integer'),
	CONSTRAINT "dnd35_character_spell_preparations_expended_count_integer" CHECK("dnd35_character_spell_preparations"."expended_count" is null or typeof("dnd35_character_spell_preparations"."expended_count") = 'integer'),
	CONSTRAINT "dnd35_character_preparations_slot_valid" CHECK("dnd35_character_spell_preparations"."slot_level" >= 0),
	CONSTRAINT "dnd35_character_preparations_count_valid" CHECK("dnd35_character_spell_preparations"."prepared_count" > 0),
	CONSTRAINT "dnd35_character_preparations_expended_valid" CHECK("dnd35_character_spell_preparations"."expended_count" >= 0),
	CONSTRAINT "dnd35_character_preparations_expended_limit" CHECK("dnd35_character_spell_preparations"."expended_count" <= "dnd35_character_spell_preparations"."prepared_count"),
	CONSTRAINT "dnd35_character_preparations_key_nonempty" CHECK(length(trim("dnd35_character_spell_preparations"."preparation_key")) > 0)
);
--> statement-breakpoint
CREATE INDEX `dnd35_character_preparations_track_idx` ON `dnd35_character_spell_preparations` (`casting_track_id`,`slot_level`);--> statement-breakpoint
CREATE TABLE `dnd35_character_spellbook_spells` (
	`spellbook_id` text NOT NULL,
	`spell_id` text NOT NULL,
	`pages` integer,
	`copied_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`spellbook_id`, `spell_id`),
	FOREIGN KEY (`spellbook_id`) REFERENCES `dnd35_character_spellbooks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_spellbook_spells_pages_integer" CHECK("dnd35_character_spellbook_spells"."pages" is null or typeof("dnd35_character_spellbook_spells"."pages") = 'integer'),
	CONSTRAINT "dnd35_character_spellbook_spells_copied_at_integer" CHECK("dnd35_character_spellbook_spells"."copied_at" is null or typeof("dnd35_character_spellbook_spells"."copied_at") = 'integer'),
	CONSTRAINT "dnd35_character_spellbook_spells_pages_valid" CHECK("dnd35_character_spellbook_spells"."pages" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_spellbooks` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`name` text NOT NULL,
	`inventory_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inventory_id`,`character_id`) REFERENCES `dnd35_character_inventory`(`id`,`character_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_character_spellbooks_name_nonempty" CHECK(length(trim("dnd35_character_spellbooks"."name")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_spellbooks_inventory_uq` ON `dnd35_character_spellbooks` (`inventory_id`) WHERE "dnd35_character_spellbooks"."inventory_id" is not null;--> statement-breakpoint
CREATE INDEX `dnd35_character_spellbooks_character_idx` ON `dnd35_character_spellbooks` (`character_id`);--> statement-breakpoint
CREATE TABLE `dnd35_character_spells` (
	`casting_track_id` text NOT NULL,
	`spell_id` text NOT NULL,
	`access_kind` text DEFAULT 'known' NOT NULL,
	`gained_at_level` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`casting_track_id`, `spell_id`),
	FOREIGN KEY (`casting_track_id`) REFERENCES `dnd35_character_casting_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_character_spells_gained_at_level_integer" CHECK("dnd35_character_spells"."gained_at_level" is null or typeof("dnd35_character_spells"."gained_at_level") = 'integer'),
	CONSTRAINT "dnd35_character_spells_access_valid" CHECK("dnd35_character_spells"."access_kind" in ('known', 'granted')),
	CONSTRAINT "dnd35_character_spells_level_valid" CHECK("dnd35_character_spells"."gained_at_level" > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`category` text NOT NULL,
	`hit_die` integer NOT NULL,
	`skill_points_per_level` integer NOT NULL,
	`bab_progression` text NOT NULL,
	`fort_progression` text NOT NULL,
	`ref_progression` text NOT NULL,
	`will_progression` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_classes_hit_die_integer" CHECK("dnd35_classes"."hit_die" is null or typeof("dnd35_classes"."hit_die") = 'integer'),
	CONSTRAINT "dnd35_classes_skill_points_per_level_integer" CHECK("dnd35_classes"."skill_points_per_level" is null or typeof("dnd35_classes"."skill_points_per_level") = 'integer'),
	CONSTRAINT "dnd35_classes_slug_nonempty" CHECK(length(trim("dnd35_classes"."slug")) > 0),
	CONSTRAINT "dnd35_classes_name_nonempty" CHECK(length(trim("dnd35_classes"."name")) > 0),
	CONSTRAINT "dnd35_classes_owner_nonempty" CHECK(length(trim("dnd35_classes"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_classes_homebrew_bool" CHECK("dnd35_classes"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_classes_enabled_bool" CHECK("dnd35_classes"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_classes_category_valid" CHECK("dnd35_classes"."category" in ('base', 'prestige', 'npc')),
	CONSTRAINT "dnd35_classes_hd_positive" CHECK("dnd35_classes"."hit_die" > 0),
	CONSTRAINT "dnd35_classes_skill_points_valid" CHECK("dnd35_classes"."skill_points_per_level" >= 0),
	CONSTRAINT "dnd35_classes_bab_valid" CHECK("dnd35_classes"."bab_progression" in ('full', 'three_quarters', 'half', 'custom')),
	CONSTRAINT "dnd35_classes_save_0_valid" CHECK("dnd35_classes"."fort_progression" in ('good', 'poor', 'custom')),
	CONSTRAINT "dnd35_classes_save_1_valid" CHECK("dnd35_classes"."ref_progression" in ('good', 'poor', 'custom')),
	CONSTRAINT "dnd35_classes_save_2_valid" CHECK("dnd35_classes"."will_progression" in ('good', 'poor', 'custom'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_classes_source_slug_owner_uq` ON `dnd35_classes` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_classes_source_slug_shared_uq` ON `dnd35_classes` (`source_id`,`slug`) WHERE "dnd35_classes"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_classes_slug_idx` ON `dnd35_classes` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_classes_owner_idx` ON `dnd35_classes` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_class_features` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`special_ability_id` text,
	`choice_kind` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_class_features_slug_nonempty" CHECK(length(trim("dnd35_class_features"."slug")) > 0),
	CONSTRAINT "dnd35_class_features_name_nonempty" CHECK(length(trim("dnd35_class_features"."name")) > 0),
	CONSTRAINT "dnd35_class_features_owner_nonempty" CHECK(length(trim("dnd35_class_features"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_class_features_homebrew_bool" CHECK("dnd35_class_features"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_class_features_enabled_bool" CHECK("dnd35_class_features"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_class_features_source_slug_owner_uq` ON `dnd35_class_features` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_class_features_source_slug_shared_uq` ON `dnd35_class_features` (`source_id`,`slug`) WHERE "dnd35_class_features"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_class_features_slug_idx` ON `dnd35_class_features` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_class_features_owner_idx` ON `dnd35_class_features` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_class_features_ability_idx` ON `dnd35_class_features` (`special_ability_id`);--> statement-breakpoint
CREATE TABLE `dnd35_class_feature_grants` (
	`class_level_id` text NOT NULL,
	`class_feature_id` text NOT NULL,
	`parameters` text,
	`rules_text` text,
	PRIMARY KEY(`class_level_id`, `class_feature_id`),
	FOREIGN KEY (`class_level_id`) REFERENCES `dnd35_class_levels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_feature_id`) REFERENCES `dnd35_class_features`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_class_feature_grants_parameters_json" CHECK(case when "dnd35_class_feature_grants"."parameters" is null then 1 when json_valid("dnd35_class_feature_grants"."parameters") then json_type("dnd35_class_feature_grants"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE INDEX `dnd35_class_feature_grants_reverse_idx` ON `dnd35_class_feature_grants` (`class_feature_id`);--> statement-breakpoint
CREATE TABLE `dnd35_class_levels` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`level` integer NOT NULL,
	`base_attack_bonus` integer NOT NULL,
	`fort` integer NOT NULL,
	`ref` integer NOT NULL,
	`will` integer NOT NULL,
	`hit_die` integer,
	`skill_points` integer,
	`base_power_points` integer,
	`powers_known` integer,
	`max_power_level` integer,
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_class_levels_level_integer" CHECK("dnd35_class_levels"."level" is null or typeof("dnd35_class_levels"."level") = 'integer'),
	CONSTRAINT "dnd35_class_levels_base_attack_bonus_integer" CHECK("dnd35_class_levels"."base_attack_bonus" is null or typeof("dnd35_class_levels"."base_attack_bonus") = 'integer'),
	CONSTRAINT "dnd35_class_levels_fort_integer" CHECK("dnd35_class_levels"."fort" is null or typeof("dnd35_class_levels"."fort") = 'integer'),
	CONSTRAINT "dnd35_class_levels_ref_integer" CHECK("dnd35_class_levels"."ref" is null or typeof("dnd35_class_levels"."ref") = 'integer'),
	CONSTRAINT "dnd35_class_levels_will_integer" CHECK("dnd35_class_levels"."will" is null or typeof("dnd35_class_levels"."will") = 'integer'),
	CONSTRAINT "dnd35_class_levels_hit_die_integer" CHECK("dnd35_class_levels"."hit_die" is null or typeof("dnd35_class_levels"."hit_die") = 'integer'),
	CONSTRAINT "dnd35_class_levels_skill_points_integer" CHECK("dnd35_class_levels"."skill_points" is null or typeof("dnd35_class_levels"."skill_points") = 'integer'),
	CONSTRAINT "dnd35_class_levels_base_power_points_integer" CHECK("dnd35_class_levels"."base_power_points" is null or typeof("dnd35_class_levels"."base_power_points") = 'integer'),
	CONSTRAINT "dnd35_class_levels_powers_known_integer" CHECK("dnd35_class_levels"."powers_known" is null or typeof("dnd35_class_levels"."powers_known") = 'integer'),
	CONSTRAINT "dnd35_class_levels_max_power_level_integer" CHECK("dnd35_class_levels"."max_power_level" is null or typeof("dnd35_class_levels"."max_power_level") = 'integer'),
	CONSTRAINT "dnd35_class_levels_level_valid" CHECK("dnd35_class_levels"."level" > 0),
	CONSTRAINT "dnd35_class_levels_hd_valid" CHECK("dnd35_class_levels"."hit_die" > 0),
	CONSTRAINT "dnd35_class_levels_skills_valid" CHECK("dnd35_class_levels"."skill_points" >= 0),
	CONSTRAINT "dnd35_class_levels_bab_valid" CHECK("dnd35_class_levels"."base_attack_bonus" >= 0),
	CONSTRAINT "dnd35_class_levels_fort_valid" CHECK("dnd35_class_levels"."fort" >= 0),
	CONSTRAINT "dnd35_class_levels_ref_valid" CHECK("dnd35_class_levels"."ref" >= 0),
	CONSTRAINT "dnd35_class_levels_will_valid" CHECK("dnd35_class_levels"."will" >= 0),
	CONSTRAINT "dnd35_class_levels_pp_valid" CHECK("dnd35_class_levels"."base_power_points" >= 0),
	CONSTRAINT "dnd35_class_levels_known_valid" CHECK("dnd35_class_levels"."powers_known" >= 0),
	CONSTRAINT "dnd35_class_levels_power_level_valid" CHECK("dnd35_class_levels"."max_power_level" between 1 and 9)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_class_levels_class_level_uq` ON `dnd35_class_levels` (`class_id`,`level`);--> statement-breakpoint
CREATE TABLE `dnd35_class_prerequisites` (
	`class_id` text PRIMARY KEY NOT NULL,
	`expression` text NOT NULL,
	`explanation` text,
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_class_prerequisites_expression_json" CHECK(case when "dnd35_class_prerequisites"."expression" is null then 1 when json_valid("dnd35_class_prerequisites"."expression") then json_type("dnd35_class_prerequisites"."expression") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_class_skills` (
	`class_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`class_id`, `skill_id`),
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_class_skills_reverse_idx` ON `dnd35_class_skills` (`skill_id`);--> statement-breakpoint
CREATE TABLE `dnd35_class_casting_advancements` (
	`id` text PRIMARY KEY NOT NULL,
	`class_level_id` text NOT NULL,
	`selection_key` text NOT NULL,
	`tradition` text NOT NULL,
	`levels_advanced` integer DEFAULT 1 NOT NULL,
	`rules_text` text,
	FOREIGN KEY (`class_level_id`) REFERENCES `dnd35_class_levels`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_class_casting_advancements_levels_advanced_integer" CHECK("dnd35_class_casting_advancements"."levels_advanced" is null or typeof("dnd35_class_casting_advancements"."levels_advanced") = 'integer'),
	CONSTRAINT "dnd35_casting_advancement_key_nonempty" CHECK(length(trim("dnd35_class_casting_advancements"."selection_key")) > 0),
	CONSTRAINT "dnd35_casting_advancement_levels_valid" CHECK("dnd35_class_casting_advancements"."levels_advanced" > 0),
	CONSTRAINT "dnd35_casting_advancement_tradition_valid" CHECK("dnd35_class_casting_advancements"."tradition" in ('arcane', 'divine', 'psionic', 'other', 'any'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_casting_advancement_selection_uq` ON `dnd35_class_casting_advancements` (`class_level_id`,`selection_key`);--> statement-breakpoint
CREATE TABLE `dnd35_class_spellcasting` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`spell_list_class_id` text,
	`track_key` text DEFAULT 'primary' NOT NULL,
	`tradition` text NOT NULL,
	`casting_mode` text NOT NULL,
	`casting_ability` text NOT NULL,
	`list_behavior` text DEFAULT 'own' NOT NULL,
	`known_behavior` text NOT NULL,
	`caster_level_numerator` integer DEFAULT 1 NOT NULL,
	`caster_level_denominator` integer DEFAULT 1 NOT NULL,
	`progression_key` text NOT NULL,
	`rules_text` text,
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_list_class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_class_spellcasting_caster_level_numerator_integer" CHECK("dnd35_class_spellcasting"."caster_level_numerator" is null or typeof("dnd35_class_spellcasting"."caster_level_numerator") = 'integer'),
	CONSTRAINT "dnd35_class_spellcasting_caster_level_denominator_integer" CHECK("dnd35_class_spellcasting"."caster_level_denominator" is null or typeof("dnd35_class_spellcasting"."caster_level_denominator") = 'integer'),
	CONSTRAINT "dnd35_class_spellcasting_track_nonempty" CHECK(length(trim("dnd35_class_spellcasting"."track_key")) > 0),
	CONSTRAINT "dnd35_class_spellcasting_progression_nonempty" CHECK(length(trim("dnd35_class_spellcasting"."progression_key")) > 0),
	CONSTRAINT "dnd35_class_spellcasting_tradition_valid" CHECK("dnd35_class_spellcasting"."tradition" in ('arcane', 'divine', 'psionic', 'other')),
	CONSTRAINT "dnd35_class_spellcasting_mode_valid" CHECK("dnd35_class_spellcasting"."casting_mode" in ('prepared', 'spontaneous', 'psionic', 'other')),
	CONSTRAINT "dnd35_class_spellcasting_ability_valid" CHECK("dnd35_class_spellcasting"."casting_ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
	CONSTRAINT "dnd35_class_spellcasting_list_valid" CHECK("dnd35_class_spellcasting"."list_behavior" in ('own', 'shared', 'selected', 'advance_existing')),
	CONSTRAINT "dnd35_class_spellcasting_known_valid" CHECK("dnd35_class_spellcasting"."known_behavior" in ('all_list', 'limited', 'spellbook', 'none', 'other')),
	CONSTRAINT "dnd35_class_spellcasting_numerator_valid" CHECK("dnd35_class_spellcasting"."caster_level_numerator" > 0),
	CONSTRAINT "dnd35_class_spellcasting_denominator_valid" CHECK("dnd35_class_spellcasting"."caster_level_denominator" > 0),
	CONSTRAINT "dnd35_class_spellcasting_shared_list_present" CHECK("dnd35_class_spellcasting"."list_behavior" != 'shared' or "dnd35_class_spellcasting"."spell_list_class_id" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_class_spellcasting_track_uq` ON `dnd35_class_spellcasting` (`class_id`,`track_key`);--> statement-breakpoint
CREATE TABLE `dnd35_class_spellcasting_progression` (
	`class_id` text NOT NULL,
	`track_key` text NOT NULL,
	`class_level` integer NOT NULL,
	`spell_level` integer NOT NULL,
	`slots_per_day` integer,
	`spells_known` integer,
	PRIMARY KEY(`class_id`, `track_key`, `class_level`, `spell_level`),
	FOREIGN KEY (`class_id`,`track_key`) REFERENCES `dnd35_class_spellcasting`(`class_id`,`track_key`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`,`class_level`) REFERENCES `dnd35_class_levels`(`class_id`,`level`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_class_spellcasting_progression_class_level_integer" CHECK("dnd35_class_spellcasting_progression"."class_level" is null or typeof("dnd35_class_spellcasting_progression"."class_level") = 'integer'),
	CONSTRAINT "dnd35_class_spellcasting_progression_spell_level_integer" CHECK("dnd35_class_spellcasting_progression"."spell_level" is null or typeof("dnd35_class_spellcasting_progression"."spell_level") = 'integer'),
	CONSTRAINT "dnd35_class_spellcasting_progression_slots_per_day_integer" CHECK("dnd35_class_spellcasting_progression"."slots_per_day" is null or typeof("dnd35_class_spellcasting_progression"."slots_per_day") = 'integer'),
	CONSTRAINT "dnd35_class_spellcasting_progression_spells_known_integer" CHECK("dnd35_class_spellcasting_progression"."spells_known" is null or typeof("dnd35_class_spellcasting_progression"."spells_known") = 'integer'),
	CONSTRAINT "dnd35_casting_progression_level_valid" CHECK("dnd35_class_spellcasting_progression"."spell_level" between 0 and 9),
	CONSTRAINT "dnd35_casting_progression_slots_valid" CHECK("dnd35_class_spellcasting_progression"."slots_per_day" >= 0),
	CONSTRAINT "dnd35_casting_progression_known_valid" CHECK("dnd35_class_spellcasting_progression"."spells_known" >= 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`stacking` text DEFAULT 'replace' NOT NULL,
	`effects` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_conditions_slug_nonempty" CHECK(length(trim("dnd35_conditions"."slug")) > 0),
	CONSTRAINT "dnd35_conditions_name_nonempty" CHECK(length(trim("dnd35_conditions"."name")) > 0),
	CONSTRAINT "dnd35_conditions_owner_nonempty" CHECK(length(trim("dnd35_conditions"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_conditions_homebrew_bool" CHECK("dnd35_conditions"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_conditions_enabled_bool" CHECK("dnd35_conditions"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_conditions_stacking_valid" CHECK("dnd35_conditions"."stacking" in ('replace', 'independent', 'cumulative', 'special')),
	CONSTRAINT "dnd35_conditions_effects_json" CHECK(case when "dnd35_conditions"."effects" is null then 1 when json_valid("dnd35_conditions"."effects") then json_type("dnd35_conditions"."effects") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_conditions_source_slug_owner_uq` ON `dnd35_conditions` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_conditions_source_slug_shared_uq` ON `dnd35_conditions` (`source_id`,`slug`) WHERE "dnd35_conditions"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_conditions_slug_idx` ON `dnd35_conditions` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_conditions_owner_idx` ON `dnd35_conditions` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_creature_subtypes` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_creature_subtypes_slug_nonempty" CHECK(length(trim("dnd35_creature_subtypes"."slug")) > 0),
	CONSTRAINT "dnd35_creature_subtypes_name_nonempty" CHECK(length(trim("dnd35_creature_subtypes"."name")) > 0),
	CONSTRAINT "dnd35_creature_subtypes_owner_nonempty" CHECK(length(trim("dnd35_creature_subtypes"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_creature_subtypes_homebrew_bool" CHECK("dnd35_creature_subtypes"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_creature_subtypes_enabled_bool" CHECK("dnd35_creature_subtypes"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_creature_subtypes_source_slug_owner_uq` ON `dnd35_creature_subtypes` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_creature_subtypes_source_slug_shared_uq` ON `dnd35_creature_subtypes` (`source_id`,`slug`) WHERE "dnd35_creature_subtypes"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_creature_subtypes_slug_idx` ON `dnd35_creature_subtypes` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_creature_subtypes_owner_idx` ON `dnd35_creature_subtypes` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_creature_types` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`hit_die` integer,
	`skill_points_per_hit_die` integer,
	`bab_progression` text,
	`fort_progression` text,
	`ref_progression` text,
	`will_progression` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_creature_types_hit_die_integer" CHECK("dnd35_creature_types"."hit_die" is null or typeof("dnd35_creature_types"."hit_die") = 'integer'),
	CONSTRAINT "dnd35_creature_types_skill_points_per_hit_die_integer" CHECK("dnd35_creature_types"."skill_points_per_hit_die" is null or typeof("dnd35_creature_types"."skill_points_per_hit_die") = 'integer'),
	CONSTRAINT "dnd35_creature_types_slug_nonempty" CHECK(length(trim("dnd35_creature_types"."slug")) > 0),
	CONSTRAINT "dnd35_creature_types_name_nonempty" CHECK(length(trim("dnd35_creature_types"."name")) > 0),
	CONSTRAINT "dnd35_creature_types_owner_nonempty" CHECK(length(trim("dnd35_creature_types"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_creature_types_homebrew_bool" CHECK("dnd35_creature_types"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_creature_types_enabled_bool" CHECK("dnd35_creature_types"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_creature_types_hd_valid" CHECK("dnd35_creature_types"."hit_die" > 0),
	CONSTRAINT "dnd35_creature_types_skills_valid" CHECK("dnd35_creature_types"."skill_points_per_hit_die" >= 0),
	CONSTRAINT "dnd35_creature_types_bab_valid" CHECK("dnd35_creature_types"."bab_progression" in ('full', 'three_quarters', 'half', 'custom')),
	CONSTRAINT "dnd35_creature_types_save_0_valid" CHECK("dnd35_creature_types"."fort_progression" in ('good', 'poor', 'custom')),
	CONSTRAINT "dnd35_creature_types_save_1_valid" CHECK("dnd35_creature_types"."ref_progression" in ('good', 'poor', 'custom')),
	CONSTRAINT "dnd35_creature_types_save_2_valid" CHECK("dnd35_creature_types"."will_progression" in ('good', 'poor', 'custom'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_creature_types_source_slug_owner_uq` ON `dnd35_creature_types` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_creature_types_source_slug_shared_uq` ON `dnd35_creature_types` (`source_id`,`slug`) WHERE "dnd35_creature_types"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_creature_types_slug_idx` ON `dnd35_creature_types` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_creature_types_owner_idx` ON `dnd35_creature_types` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_deities` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`alignment` text,
	`portfolio` text,
	`symbol` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_deities_slug_nonempty" CHECK(length(trim("dnd35_deities"."slug")) > 0),
	CONSTRAINT "dnd35_deities_name_nonempty" CHECK(length(trim("dnd35_deities"."name")) > 0),
	CONSTRAINT "dnd35_deities_owner_nonempty" CHECK(length(trim("dnd35_deities"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_deities_homebrew_bool" CHECK("dnd35_deities"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_deities_enabled_bool" CHECK("dnd35_deities"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_deities_alignment_valid" CHECK("dnd35_deities"."alignment" in ('LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_deities_source_slug_owner_uq` ON `dnd35_deities` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_deities_source_slug_shared_uq` ON `dnd35_deities` (`source_id`,`slug`) WHERE "dnd35_deities"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_deities_slug_idx` ON `dnd35_deities` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_deities_owner_idx` ON `dnd35_deities` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_deity_domains` (
	`deity_id` text NOT NULL,
	`domain_id` text NOT NULL,
	PRIMARY KEY(`deity_id`, `domain_id`),
	FOREIGN KEY (`deity_id`) REFERENCES `dnd35_deities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `dnd35_domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_deity_domains_reverse_idx` ON `dnd35_deity_domains` (`domain_id`);--> statement-breakpoint
CREATE TABLE `dnd35_deity_favored_weapons` (
	`deity_id` text NOT NULL,
	`weapon_id` text NOT NULL,
	PRIMARY KEY(`deity_id`, `weapon_id`),
	FOREIGN KEY (`deity_id`) REFERENCES `dnd35_deities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`weapon_id`) REFERENCES `dnd35_weapons`(`item_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_deity_weapons_reverse_idx` ON `dnd35_deity_favored_weapons` (`weapon_id`);--> statement-breakpoint
CREATE TABLE `dnd35_domain_granted_powers` (
	`domain_id` text NOT NULL,
	`special_ability_id` text NOT NULL,
	`parameters` text,
	PRIMARY KEY(`domain_id`, `special_ability_id`),
	FOREIGN KEY (`domain_id`) REFERENCES `dnd35_domains`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_domain_powers_parameters_json" CHECK(case when "dnd35_domain_granted_powers"."parameters" is null then 1 when json_valid("dnd35_domain_granted_powers"."parameters") then json_type("dnd35_domain_granted_powers"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`granted_power_text` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_domains_slug_nonempty" CHECK(length(trim("dnd35_domains"."slug")) > 0),
	CONSTRAINT "dnd35_domains_name_nonempty" CHECK(length(trim("dnd35_domains"."name")) > 0),
	CONSTRAINT "dnd35_domains_owner_nonempty" CHECK(length(trim("dnd35_domains"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_domains_homebrew_bool" CHECK("dnd35_domains"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_domains_enabled_bool" CHECK("dnd35_domains"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_domains_source_slug_owner_uq` ON `dnd35_domains` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_domains_source_slug_shared_uq` ON `dnd35_domains` (`source_id`,`slug`) WHERE "dnd35_domains"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_domains_slug_idx` ON `dnd35_domains` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_domains_owner_idx` ON `dnd35_domains` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_feat_category_assignments` (
	`feat_id` text NOT NULL,
	`category` text NOT NULL,
	PRIMARY KEY(`feat_id`, `category`),
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_feat_categories_valid" CHECK("dnd35_feat_category_assignments"."category" in ('general', 'fighter', 'metamagic', 'item_creation', 'psionic', 'epic', 'racial', 'divine', 'wild', 'heritage', 'tactical', 'reserve', 'incarnum', 'vile', 'exalted', 'other'))
);
--> statement-breakpoint
CREATE INDEX `dnd35_feat_categories_category_idx` ON `dnd35_feat_category_assignments` (`category`);--> statement-breakpoint
CREATE TABLE `dnd35_feats` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`repeatable` integer DEFAULT false NOT NULL,
	`choice_kind` text DEFAULT 'none' NOT NULL,
	`repeatability_text` text,
	`normal_text` text,
	`special_text` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_feats_repeatable_integer" CHECK("dnd35_feats"."repeatable" is null or typeof("dnd35_feats"."repeatable") = 'integer'),
	CONSTRAINT "dnd35_feats_slug_nonempty" CHECK(length(trim("dnd35_feats"."slug")) > 0),
	CONSTRAINT "dnd35_feats_name_nonempty" CHECK(length(trim("dnd35_feats"."name")) > 0),
	CONSTRAINT "dnd35_feats_owner_nonempty" CHECK(length(trim("dnd35_feats"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_feats_homebrew_bool" CHECK("dnd35_feats"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_feats_enabled_bool" CHECK("dnd35_feats"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_feats_repeatable_bool" CHECK("dnd35_feats"."repeatable" in (0, 1)),
	CONSTRAINT "dnd35_feats_choice_valid" CHECK("dnd35_feats"."choice_kind" in ('none', 'skill', 'weapon', 'school', 'spell', 'other'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_feats_source_slug_owner_uq` ON `dnd35_feats` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_feats_source_slug_shared_uq` ON `dnd35_feats` (`source_id`,`slug`) WHERE "dnd35_feats"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_feats_slug_idx` ON `dnd35_feats` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_feats_owner_idx` ON `dnd35_feats` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_feat_benefits` (
	`id` text PRIMARY KEY NOT NULL,
	`feat_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`kind` text NOT NULL,
	`ability` text,
	`save` text,
	`skill_id` text,
	`stat` text,
	`amount` integer,
	`bonus_type` text,
	`when_text` text,
	`description` text NOT NULL,
	`effect` text,
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_feat_benefits_position_integer" CHECK("dnd35_feat_benefits"."position" is null or typeof("dnd35_feat_benefits"."position") = 'integer'),
	CONSTRAINT "dnd35_feat_benefits_amount_integer" CHECK("dnd35_feat_benefits"."amount" is null or typeof("dnd35_feat_benefits"."amount") = 'integer'),
	CONSTRAINT "dnd35_feat_benefits_position_valid" CHECK("dnd35_feat_benefits"."position" >= 0),
	CONSTRAINT "dnd35_feat_benefits_description_nonempty" CHECK(length(trim("dnd35_feat_benefits"."description")) > 0),
	CONSTRAINT "dnd35_feat_benefits_kind_valid" CHECK("dnd35_feat_benefits"."kind" in ('ability_bonus', 'save_bonus', 'skill_bonus', 'stat_bonus', 'effect')),
	CONSTRAINT "dnd35_feat_benefits_ability_valid" CHECK("dnd35_feat_benefits"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
	CONSTRAINT "dnd35_feat_benefits_save_valid" CHECK("dnd35_feat_benefits"."save" in ('fort', 'ref', 'will')),
	CONSTRAINT "dnd35_feat_benefits_bonus_valid" CHECK("dnd35_feat_benefits"."bonus_type" in ('alchemical', 'armor', 'circumstance', 'competence', 'deflection', 'dodge', 'enhancement', 'inherent', 'insight', 'luck', 'morale', 'natural_armor', 'profane', 'racial', 'resistance', 'sacred', 'shield', 'size', 'untyped', 'other')),
	CONSTRAINT "dnd35_feat_benefits_effect_json" CHECK(case when "dnd35_feat_benefits"."effect" is null then 1 when json_valid("dnd35_feat_benefits"."effect") then json_type("dnd35_feat_benefits"."effect") = 'object' else 0 end),
	CONSTRAINT "dnd35_feat_benefits_payload_valid" CHECK(
 ("dnd35_feat_benefits"."kind" = 'effect' and "dnd35_feat_benefits"."effect" is not null and "dnd35_feat_benefits"."amount" is null and "dnd35_feat_benefits"."bonus_type" is null and "dnd35_feat_benefits"."ability" is null and "dnd35_feat_benefits"."save" is null and "dnd35_feat_benefits"."skill_id" is null and "dnd35_feat_benefits"."stat" is null)
 or ("dnd35_feat_benefits"."kind" != 'effect' and "dnd35_feat_benefits"."effect" is null and "dnd35_feat_benefits"."amount" is not null and "dnd35_feat_benefits"."bonus_type" is not null and (
 ("dnd35_feat_benefits"."kind" = 'ability_bonus' and "dnd35_feat_benefits"."ability" is not null and "dnd35_feat_benefits"."save" is null and "dnd35_feat_benefits"."skill_id" is null and "dnd35_feat_benefits"."stat" is null) or
 ("dnd35_feat_benefits"."kind" = 'save_bonus' and "dnd35_feat_benefits"."save" is not null and "dnd35_feat_benefits"."ability" is null and "dnd35_feat_benefits"."skill_id" is null and "dnd35_feat_benefits"."stat" is null) or
 ("dnd35_feat_benefits"."kind" = 'skill_bonus' and "dnd35_feat_benefits"."skill_id" is not null and "dnd35_feat_benefits"."ability" is null and "dnd35_feat_benefits"."save" is null and "dnd35_feat_benefits"."stat" is null) or
 ("dnd35_feat_benefits"."kind" = 'stat_bonus' and "dnd35_feat_benefits"."stat" is not null and length(trim("dnd35_feat_benefits"."stat")) > 0 and "dnd35_feat_benefits"."ability" is null and "dnd35_feat_benefits"."save" is null and "dnd35_feat_benefits"."skill_id" is null))))
);
--> statement-breakpoint
CREATE INDEX `dnd35_feat_benefits_feat_idx` ON `dnd35_feat_benefits` (`feat_id`,`position`);--> statement-breakpoint
CREATE TABLE `dnd35_feat_prerequisites` (
	`feat_id` text PRIMARY KEY NOT NULL,
	`expression` text NOT NULL,
	`explanation` text,
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_feat_prerequisites_expression_json" CHECK(case when "dnd35_feat_prerequisites"."expression" is null then 1 when json_valid("dnd35_feat_prerequisites"."expression") then json_type("dnd35_feat_prerequisites"."expression") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_items` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`category` text NOT NULL,
	`price_copper` integer,
	`weight_pounds` real,
	`size` text,
	`hardness` integer,
	`hit_points` integer,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_items_price_copper_integer" CHECK("dnd35_items"."price_copper" is null or typeof("dnd35_items"."price_copper") = 'integer'),
	CONSTRAINT "dnd35_items_hardness_integer" CHECK("dnd35_items"."hardness" is null or typeof("dnd35_items"."hardness") = 'integer'),
	CONSTRAINT "dnd35_items_hit_points_integer" CHECK("dnd35_items"."hit_points" is null or typeof("dnd35_items"."hit_points") = 'integer'),
	CONSTRAINT "dnd35_items_slug_nonempty" CHECK(length(trim("dnd35_items"."slug")) > 0),
	CONSTRAINT "dnd35_items_name_nonempty" CHECK(length(trim("dnd35_items"."name")) > 0),
	CONSTRAINT "dnd35_items_owner_nonempty" CHECK(length(trim("dnd35_items"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_items_homebrew_bool" CHECK("dnd35_items"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_items_enabled_bool" CHECK("dnd35_items"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_items_category_valid" CHECK("dnd35_items"."category" in ('weapon', 'armor', 'shield', 'ammunition', 'gear', 'consumable', 'container', 'magic', 'other')),
	CONSTRAINT "dnd35_items_price_valid" CHECK("dnd35_items"."price_copper" >= 0),
	CONSTRAINT "dnd35_items_weight_valid" CHECK("dnd35_items"."weight_pounds" >= 0),
	CONSTRAINT "dnd35_items_hardness_valid" CHECK("dnd35_items"."hardness" >= 0),
	CONSTRAINT "dnd35_items_hp_valid" CHECK("dnd35_items"."hit_points" >= 0),
	CONSTRAINT "dnd35_items_size_valid" CHECK("dnd35_items"."size" in ('fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_items_source_slug_owner_uq` ON `dnd35_items` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_items_source_slug_shared_uq` ON `dnd35_items` (`source_id`,`slug`) WHERE "dnd35_items"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_items_slug_idx` ON `dnd35_items` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_items_owner_idx` ON `dnd35_items` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_items_category_idx` ON `dnd35_items` (`category`);--> statement-breakpoint
CREATE TABLE `dnd35_item_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`kind` text NOT NULL,
	`enhancement_equivalent` integer DEFAULT 0 NOT NULL,
	`flat_price_copper` integer DEFAULT 0 NOT NULL,
	`minimum_caster_level` integer,
	`effects` text,
	`prerequisites` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_item_properties_enhancement_equivalent_integer" CHECK("dnd35_item_properties"."enhancement_equivalent" is null or typeof("dnd35_item_properties"."enhancement_equivalent") = 'integer'),
	CONSTRAINT "dnd35_item_properties_flat_price_copper_integer" CHECK("dnd35_item_properties"."flat_price_copper" is null or typeof("dnd35_item_properties"."flat_price_copper") = 'integer'),
	CONSTRAINT "dnd35_item_properties_minimum_caster_level_integer" CHECK("dnd35_item_properties"."minimum_caster_level" is null or typeof("dnd35_item_properties"."minimum_caster_level") = 'integer'),
	CONSTRAINT "dnd35_item_properties_slug_nonempty" CHECK(length(trim("dnd35_item_properties"."slug")) > 0),
	CONSTRAINT "dnd35_item_properties_name_nonempty" CHECK(length(trim("dnd35_item_properties"."name")) > 0),
	CONSTRAINT "dnd35_item_properties_owner_nonempty" CHECK(length(trim("dnd35_item_properties"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_item_properties_homebrew_bool" CHECK("dnd35_item_properties"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_item_properties_enabled_bool" CHECK("dnd35_item_properties"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_item_properties_kind_valid" CHECK("dnd35_item_properties"."kind" in ('mundane', 'enhancement', 'magic', 'psionic', 'other')),
	CONSTRAINT "dnd35_item_properties_enhancement_valid" CHECK("dnd35_item_properties"."enhancement_equivalent" >= 0),
	CONSTRAINT "dnd35_item_properties_price_valid" CHECK("dnd35_item_properties"."flat_price_copper" >= 0),
	CONSTRAINT "dnd35_item_properties_caster_valid" CHECK("dnd35_item_properties"."minimum_caster_level" > 0),
	CONSTRAINT "dnd35_item_properties_effects_json" CHECK(case when "dnd35_item_properties"."effects" is null then 1 when json_valid("dnd35_item_properties"."effects") then json_type("dnd35_item_properties"."effects") = 'array' else 0 end),
	CONSTRAINT "dnd35_item_properties_prerequisites_json" CHECK(case when "dnd35_item_properties"."prerequisites" is null then 1 when json_valid("dnd35_item_properties"."prerequisites") then json_type("dnd35_item_properties"."prerequisites") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_item_properties_source_slug_owner_uq` ON `dnd35_item_properties` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_item_properties_source_slug_shared_uq` ON `dnd35_item_properties` (`source_id`,`slug`) WHERE "dnd35_item_properties"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_item_properties_slug_idx` ON `dnd35_item_properties` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_item_properties_owner_idx` ON `dnd35_item_properties` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_item_property_applicability` (
	`property_id` text NOT NULL,
	`category` text NOT NULL,
	PRIMARY KEY(`property_id`, `category`),
	FOREIGN KEY (`property_id`) REFERENCES `dnd35_item_properties`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_property_applicability_category_valid" CHECK("dnd35_item_property_applicability"."category" in ('weapon', 'armor', 'shield', 'ammunition', 'other'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_item_property_assignments` (
	`item_id` text NOT NULL,
	`property_id` text NOT NULL,
	`parameters` text,
	PRIMARY KEY(`item_id`, `property_id`),
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `dnd35_item_properties`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_item_property_assignments_parameters_json" CHECK(case when "dnd35_item_property_assignments"."parameters" is null then 1 when json_valid("dnd35_item_property_assignments"."parameters") then json_type("dnd35_item_property_assignments"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE INDEX `dnd35_item_property_assignments_reverse_idx` ON `dnd35_item_property_assignments` (`property_id`);--> statement-breakpoint
CREATE TABLE `dnd35_languages` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`script` text,
	`typical_speakers` text,
	`is_secret` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_languages_is_secret_integer" CHECK("dnd35_languages"."is_secret" is null or typeof("dnd35_languages"."is_secret") = 'integer'),
	CONSTRAINT "dnd35_languages_slug_nonempty" CHECK(length(trim("dnd35_languages"."slug")) > 0),
	CONSTRAINT "dnd35_languages_name_nonempty" CHECK(length(trim("dnd35_languages"."name")) > 0),
	CONSTRAINT "dnd35_languages_owner_nonempty" CHECK(length(trim("dnd35_languages"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_languages_homebrew_bool" CHECK("dnd35_languages"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_languages_enabled_bool" CHECK("dnd35_languages"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_languages_secret_bool" CHECK("dnd35_languages"."is_secret" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_languages_source_slug_owner_uq` ON `dnd35_languages` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_languages_source_slug_shared_uq` ON `dnd35_languages` (`source_id`,`slug`) WHERE "dnd35_languages"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_languages_slug_idx` ON `dnd35_languages` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_languages_owner_idx` ON `dnd35_languages` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_magic_items` (
	`item_id` text PRIMARY KEY NOT NULL,
	`aura_school_id` text,
	`caster_level` integer,
	`manifester_level` integer,
	`aura_strength` text,
	`activation` text NOT NULL,
	`activation_text` text,
	`slot` text DEFAULT 'slotless' NOT NULL,
	`maximum_charges` integer,
	`recharge_text` text,
	`enhancement_bonus` integer DEFAULT 0 NOT NULL,
	`craft_cost_copper` integer,
	`craft_xp_cost` integer,
	`crafting_text` text,
	`crafting_prerequisites` text,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`aura_school_id`) REFERENCES `dnd35_spell_schools`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_magic_items_caster_level_integer" CHECK("dnd35_magic_items"."caster_level" is null or typeof("dnd35_magic_items"."caster_level") = 'integer'),
	CONSTRAINT "dnd35_magic_items_manifester_level_integer" CHECK("dnd35_magic_items"."manifester_level" is null or typeof("dnd35_magic_items"."manifester_level") = 'integer'),
	CONSTRAINT "dnd35_magic_items_maximum_charges_integer" CHECK("dnd35_magic_items"."maximum_charges" is null or typeof("dnd35_magic_items"."maximum_charges") = 'integer'),
	CONSTRAINT "dnd35_magic_items_enhancement_bonus_integer" CHECK("dnd35_magic_items"."enhancement_bonus" is null or typeof("dnd35_magic_items"."enhancement_bonus") = 'integer'),
	CONSTRAINT "dnd35_magic_items_craft_cost_copper_integer" CHECK("dnd35_magic_items"."craft_cost_copper" is null or typeof("dnd35_magic_items"."craft_cost_copper") = 'integer'),
	CONSTRAINT "dnd35_magic_items_craft_xp_cost_integer" CHECK("dnd35_magic_items"."craft_xp_cost" is null or typeof("dnd35_magic_items"."craft_xp_cost") = 'integer'),
	CONSTRAINT "dnd35_magic_items_caster_valid" CHECK("dnd35_magic_items"."caster_level" > 0),
	CONSTRAINT "dnd35_magic_items_manifester_valid" CHECK("dnd35_magic_items"."manifester_level" > 0),
	CONSTRAINT "dnd35_magic_items_aura_valid" CHECK("dnd35_magic_items"."aura_strength" in ('faint', 'moderate', 'strong', 'overwhelming', 'special')),
	CONSTRAINT "dnd35_magic_items_activation_valid" CHECK("dnd35_magic_items"."activation" in ('spell_completion', 'spell_trigger', 'command_word', 'use_activated', 'continuous', 'other')),
	CONSTRAINT "dnd35_magic_items_slot_valid" CHECK("dnd35_magic_items"."slot" in ('head', 'face', 'throat', 'shoulders', 'body', 'torso', 'waist', 'arms', 'hands', 'feet', 'ring_left', 'ring_right', 'main_hand', 'off_hand', 'both_hands', 'shield', 'slotless', 'other')),
	CONSTRAINT "dnd35_magic_items_charges_valid" CHECK("dnd35_magic_items"."maximum_charges" >= 0),
	CONSTRAINT "dnd35_magic_items_enhancement_valid" CHECK("dnd35_magic_items"."enhancement_bonus" >= 0),
	CONSTRAINT "dnd35_magic_items_cost_valid" CHECK("dnd35_magic_items"."craft_cost_copper" >= 0),
	CONSTRAINT "dnd35_magic_items_xp_valid" CHECK("dnd35_magic_items"."craft_xp_cost" >= 0),
	CONSTRAINT "dnd35_magic_items_prerequisites_json" CHECK(case when "dnd35_magic_items"."crafting_prerequisites" is null then 1 when json_valid("dnd35_magic_items"."crafting_prerequisites") then json_type("dnd35_magic_items"."crafting_prerequisites") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_monster_movements` (
	`monster_id` text NOT NULL,
	`mode` text NOT NULL,
	`feet` integer NOT NULL,
	`maneuverability` text,
	`rules_text` text,
	PRIMARY KEY(`monster_id`, `mode`),
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_monster_movements_feet_integer" CHECK("dnd35_monster_movements"."feet" is null or typeof("dnd35_monster_movements"."feet") = 'integer'),
	CONSTRAINT "dnd35_monster_movements_mode_valid" CHECK("dnd35_monster_movements"."mode" in ('land', 'climb', 'swim', 'fly', 'burrow', 'glide', 'other')),
	CONSTRAINT "dnd35_monster_movements_flight_valid" CHECK("dnd35_monster_movements"."maneuverability" in ('clumsy', 'poor', 'average', 'good', 'perfect')),
	CONSTRAINT "dnd35_monster_movements_speed_valid" CHECK("dnd35_monster_movements"."feet" >= 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_monster_subtypes` (
	`monster_id` text NOT NULL,
	`subtype_id` text NOT NULL,
	PRIMARY KEY(`monster_id`, `subtype_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtype_id`) REFERENCES `dnd35_creature_subtypes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_monster_subtypes_reverse_idx` ON `dnd35_monster_subtypes` (`subtype_id`);--> statement-breakpoint
CREATE TABLE `dnd35_monsters` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`creature_type_id` text NOT NULL,
	`challenge_rating_numerator` integer NOT NULL,
	`challenge_rating_denominator` integer DEFAULT 1 NOT NULL,
	`hit_dice_numerator` integer NOT NULL,
	`hit_dice_denominator` integer DEFAULT 1 NOT NULL,
	`hit_die` integer NOT NULL,
	`hit_point_bonus` integer DEFAULT 0 NOT NULL,
	`size` text NOT NULL,
	`space_feet` real NOT NULL,
	`reach_feet` real NOT NULL,
	`natural_armor` integer DEFAULT 0 NOT NULL,
	`armor_bonus` integer DEFAULT 0 NOT NULL,
	`shield_bonus` integer DEFAULT 0 NOT NULL,
	`deflection_bonus` integer DEFAULT 0 NOT NULL,
	`base_attack_bonus` integer NOT NULL,
	`grapple_modifier` integer,
	`fort` integer NOT NULL,
	`ref` integer NOT NULL,
	`will` integer NOT NULL,
	`str` integer,
	`dex` integer,
	`con` integer,
	`int` integer,
	`wis` integer,
	`cha` integer,
	`environment` text,
	`organization` text,
	`treasure` text,
	`alignment` text,
	`alignment_text` text,
	`advancement` text,
	`level_adjustment` integer,
	`defenses` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`creature_type_id`) REFERENCES `dnd35_creature_types`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_monsters_challenge_rating_numerator_integer" CHECK("dnd35_monsters"."challenge_rating_numerator" is null or typeof("dnd35_monsters"."challenge_rating_numerator") = 'integer'),
	CONSTRAINT "dnd35_monsters_challenge_rating_denominator_integer" CHECK("dnd35_monsters"."challenge_rating_denominator" is null or typeof("dnd35_monsters"."challenge_rating_denominator") = 'integer'),
	CONSTRAINT "dnd35_monsters_hit_dice_numerator_integer" CHECK("dnd35_monsters"."hit_dice_numerator" is null or typeof("dnd35_monsters"."hit_dice_numerator") = 'integer'),
	CONSTRAINT "dnd35_monsters_hit_dice_denominator_integer" CHECK("dnd35_monsters"."hit_dice_denominator" is null or typeof("dnd35_monsters"."hit_dice_denominator") = 'integer'),
	CONSTRAINT "dnd35_monsters_hit_die_integer" CHECK("dnd35_monsters"."hit_die" is null or typeof("dnd35_monsters"."hit_die") = 'integer'),
	CONSTRAINT "dnd35_monsters_hit_point_bonus_integer" CHECK("dnd35_monsters"."hit_point_bonus" is null or typeof("dnd35_monsters"."hit_point_bonus") = 'integer'),
	CONSTRAINT "dnd35_monsters_natural_armor_integer" CHECK("dnd35_monsters"."natural_armor" is null or typeof("dnd35_monsters"."natural_armor") = 'integer'),
	CONSTRAINT "dnd35_monsters_armor_bonus_integer" CHECK("dnd35_monsters"."armor_bonus" is null or typeof("dnd35_monsters"."armor_bonus") = 'integer'),
	CONSTRAINT "dnd35_monsters_shield_bonus_integer" CHECK("dnd35_monsters"."shield_bonus" is null or typeof("dnd35_monsters"."shield_bonus") = 'integer'),
	CONSTRAINT "dnd35_monsters_deflection_bonus_integer" CHECK("dnd35_monsters"."deflection_bonus" is null or typeof("dnd35_monsters"."deflection_bonus") = 'integer'),
	CONSTRAINT "dnd35_monsters_base_attack_bonus_integer" CHECK("dnd35_monsters"."base_attack_bonus" is null or typeof("dnd35_monsters"."base_attack_bonus") = 'integer'),
	CONSTRAINT "dnd35_monsters_grapple_modifier_integer" CHECK("dnd35_monsters"."grapple_modifier" is null or typeof("dnd35_monsters"."grapple_modifier") = 'integer'),
	CONSTRAINT "dnd35_monsters_fort_integer" CHECK("dnd35_monsters"."fort" is null or typeof("dnd35_monsters"."fort") = 'integer'),
	CONSTRAINT "dnd35_monsters_ref_integer" CHECK("dnd35_monsters"."ref" is null or typeof("dnd35_monsters"."ref") = 'integer'),
	CONSTRAINT "dnd35_monsters_will_integer" CHECK("dnd35_monsters"."will" is null or typeof("dnd35_monsters"."will") = 'integer'),
	CONSTRAINT "dnd35_monsters_str_integer" CHECK("dnd35_monsters"."str" is null or typeof("dnd35_monsters"."str") = 'integer'),
	CONSTRAINT "dnd35_monsters_dex_integer" CHECK("dnd35_monsters"."dex" is null or typeof("dnd35_monsters"."dex") = 'integer'),
	CONSTRAINT "dnd35_monsters_con_integer" CHECK("dnd35_monsters"."con" is null or typeof("dnd35_monsters"."con") = 'integer'),
	CONSTRAINT "dnd35_monsters_int_integer" CHECK("dnd35_monsters"."int" is null or typeof("dnd35_monsters"."int") = 'integer'),
	CONSTRAINT "dnd35_monsters_wis_integer" CHECK("dnd35_monsters"."wis" is null or typeof("dnd35_monsters"."wis") = 'integer'),
	CONSTRAINT "dnd35_monsters_cha_integer" CHECK("dnd35_monsters"."cha" is null or typeof("dnd35_monsters"."cha") = 'integer'),
	CONSTRAINT "dnd35_monsters_level_adjustment_integer" CHECK("dnd35_monsters"."level_adjustment" is null or typeof("dnd35_monsters"."level_adjustment") = 'integer'),
	CONSTRAINT "dnd35_monsters_slug_nonempty" CHECK(length(trim("dnd35_monsters"."slug")) > 0),
	CONSTRAINT "dnd35_monsters_name_nonempty" CHECK(length(trim("dnd35_monsters"."name")) > 0),
	CONSTRAINT "dnd35_monsters_owner_nonempty" CHECK(length(trim("dnd35_monsters"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_monsters_homebrew_bool" CHECK("dnd35_monsters"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_monsters_enabled_bool" CHECK("dnd35_monsters"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_monsters_cr_valid" CHECK("dnd35_monsters"."challenge_rating_numerator" >= 0),
	CONSTRAINT "dnd35_monsters_cr_denominator_valid" CHECK("dnd35_monsters"."challenge_rating_denominator" > 0),
	CONSTRAINT "dnd35_monsters_hd_count_valid" CHECK("dnd35_monsters"."hit_dice_numerator" > 0),
	CONSTRAINT "dnd35_monsters_hd_denominator_valid" CHECK("dnd35_monsters"."hit_dice_denominator" > 0),
	CONSTRAINT "dnd35_monsters_hd_valid" CHECK("dnd35_monsters"."hit_die" > 0),
	CONSTRAINT "dnd35_monsters_size_valid" CHECK("dnd35_monsters"."size" in ('fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal')),
	CONSTRAINT "dnd35_monsters_alignment_valid" CHECK("dnd35_monsters"."alignment" in ('LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE')),
	CONSTRAINT "dnd35_monsters_space_valid" CHECK("dnd35_monsters"."space_feet" >= 0),
	CONSTRAINT "dnd35_monsters_reach_valid" CHECK("dnd35_monsters"."reach_feet" >= 0),
	CONSTRAINT "dnd35_monsters_bab_valid" CHECK("dnd35_monsters"."base_attack_bonus" >= 0),
	CONSTRAINT "dnd35_monsters_la_valid" CHECK("dnd35_monsters"."level_adjustment" >= 0),
	CONSTRAINT "dnd35_monsters_ability_0_valid" CHECK("dnd35_monsters"."str" >= 0),
	CONSTRAINT "dnd35_monsters_ability_1_valid" CHECK("dnd35_monsters"."dex" >= 0),
	CONSTRAINT "dnd35_monsters_ability_2_valid" CHECK("dnd35_monsters"."con" >= 0),
	CONSTRAINT "dnd35_monsters_ability_3_valid" CHECK("dnd35_monsters"."int" >= 0),
	CONSTRAINT "dnd35_monsters_ability_4_valid" CHECK("dnd35_monsters"."wis" >= 0),
	CONSTRAINT "dnd35_monsters_ability_5_valid" CHECK("dnd35_monsters"."cha" >= 0),
	CONSTRAINT "dnd35_monsters_defenses_json" CHECK(case when "dnd35_monsters"."defenses" is null then 1 when json_valid("dnd35_monsters"."defenses") then json_type("dnd35_monsters"."defenses") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_monsters_source_slug_owner_uq` ON `dnd35_monsters` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_monsters_source_slug_shared_uq` ON `dnd35_monsters` (`source_id`,`slug`) WHERE "dnd35_monsters"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_monsters_slug_idx` ON `dnd35_monsters` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_monsters_owner_idx` ON `dnd35_monsters` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_monsters_type_idx` ON `dnd35_monsters` (`creature_type_id`);--> statement-breakpoint
CREATE TABLE `dnd35_monster_abilities` (
	`monster_id` text NOT NULL,
	`special_ability_id` text NOT NULL,
	`role` text NOT NULL,
	`parameters` text,
	`rules_text` text,
	PRIMARY KEY(`monster_id`, `special_ability_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_monster_abilities_role_valid" CHECK("dnd35_monster_abilities"."role" in ('special_attack', 'special_quality', 'other')),
	CONSTRAINT "dnd35_monster_abilities_parameters_json" CHECK(case when "dnd35_monster_abilities"."parameters" is null then 1 when json_valid("dnd35_monster_abilities"."parameters") then json_type("dnd35_monster_abilities"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE INDEX `dnd35_monster_abilities_reverse_idx` ON `dnd35_monster_abilities` (`special_ability_id`);--> statement-breakpoint
CREATE TABLE `dnd35_monster_attack_damage_types` (
	`attack_id` text NOT NULL,
	`damage_type` text NOT NULL,
	PRIMARY KEY(`attack_id`, `damage_type`),
	FOREIGN KEY (`attack_id`) REFERENCES `dnd35_monster_attacks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_monster_attack_damage_types_valid" CHECK("dnd35_monster_attack_damage_types"."damage_type" in ('bludgeoning', 'piercing', 'slashing', 'acid', 'cold', 'electricity', 'fire', 'sonic', 'force', 'positive_energy', 'negative_energy', 'untyped'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_monster_attacks` (
	`id` text PRIMARY KEY NOT NULL,
	`monster_id` text NOT NULL,
	`weapon_id` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`attack_mode` text NOT NULL,
	`routine_key` text DEFAULT 'primary' NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`attack_count` integer DEFAULT 1 NOT NULL,
	`can_use_as_standard` integer DEFAULT true NOT NULL,
	`attack_bonus` integer NOT NULL,
	`damage_dice` text NOT NULL,
	`damage_bonus` integer DEFAULT 0 NOT NULL,
	`critical_threat_minimum` integer DEFAULT 20 NOT NULL,
	`critical_multiplier` integer DEFAULT 2 NOT NULL,
	`reach_feet` real,
	`range_increment_feet` integer,
	`special_text` text,
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`weapon_id`) REFERENCES `dnd35_weapons`(`item_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_monster_attacks_sequence_integer" CHECK("dnd35_monster_attacks"."sequence" is null or typeof("dnd35_monster_attacks"."sequence") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_attack_count_integer" CHECK("dnd35_monster_attacks"."attack_count" is null or typeof("dnd35_monster_attacks"."attack_count") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_can_use_as_standard_integer" CHECK("dnd35_monster_attacks"."can_use_as_standard" is null or typeof("dnd35_monster_attacks"."can_use_as_standard") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_attack_bonus_integer" CHECK("dnd35_monster_attacks"."attack_bonus" is null or typeof("dnd35_monster_attacks"."attack_bonus") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_damage_bonus_integer" CHECK("dnd35_monster_attacks"."damage_bonus" is null or typeof("dnd35_monster_attacks"."damage_bonus") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_critical_threat_minimum_integer" CHECK("dnd35_monster_attacks"."critical_threat_minimum" is null or typeof("dnd35_monster_attacks"."critical_threat_minimum") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_critical_multiplier_integer" CHECK("dnd35_monster_attacks"."critical_multiplier" is null or typeof("dnd35_monster_attacks"."critical_multiplier") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_range_increment_feet_integer" CHECK("dnd35_monster_attacks"."range_increment_feet" is null or typeof("dnd35_monster_attacks"."range_increment_feet") = 'integer'),
	CONSTRAINT "dnd35_monster_attacks_name_nonempty" CHECK(length(trim("dnd35_monster_attacks"."name")) > 0),
	CONSTRAINT "dnd35_monster_attacks_routine_nonempty" CHECK(length(trim("dnd35_monster_attacks"."routine_key")) > 0),
	CONSTRAINT "dnd35_monster_attacks_damage_nonempty" CHECK(length(trim("dnd35_monster_attacks"."damage_dice")) > 0),
	CONSTRAINT "dnd35_monster_attacks_kind_valid" CHECK("dnd35_monster_attacks"."kind" in ('natural', 'manufactured', 'special')),
	CONSTRAINT "dnd35_monster_attacks_mode_valid" CHECK("dnd35_monster_attacks"."attack_mode" in ('melee', 'ranged', 'melee_touch', 'ranged_touch')),
	CONSTRAINT "dnd35_monster_attacks_sequence_valid" CHECK("dnd35_monster_attacks"."sequence" >= 0),
	CONSTRAINT "dnd35_monster_attacks_count_valid" CHECK("dnd35_monster_attacks"."attack_count" > 0),
	CONSTRAINT "dnd35_monster_attacks_standard_bool" CHECK("dnd35_monster_attacks"."can_use_as_standard" in (0, 1)),
	CONSTRAINT "dnd35_monster_attacks_critical_valid" CHECK("dnd35_monster_attacks"."critical_threat_minimum" between 2 and 20 and "dnd35_monster_attacks"."critical_multiplier" >= 2),
	CONSTRAINT "dnd35_monster_attacks_reach_valid" CHECK("dnd35_monster_attacks"."reach_feet" >= 0),
	CONSTRAINT "dnd35_monster_attacks_range_valid" CHECK("dnd35_monster_attacks"."range_increment_feet" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_monster_attacks_routine_uq` ON `dnd35_monster_attacks` (`monster_id`,`routine_key`,`sequence`);--> statement-breakpoint
CREATE TABLE `dnd35_monster_feats` (
	`id` text PRIMARY KEY NOT NULL,
	`monster_id` text NOT NULL,
	`feat_id` text NOT NULL,
	`occurrence` integer DEFAULT 1 NOT NULL,
	`is_bonus` integer DEFAULT false NOT NULL,
	`choices` text,
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_monster_feats_occurrence_integer" CHECK("dnd35_monster_feats"."occurrence" is null or typeof("dnd35_monster_feats"."occurrence") = 'integer'),
	CONSTRAINT "dnd35_monster_feats_is_bonus_integer" CHECK("dnd35_monster_feats"."is_bonus" is null or typeof("dnd35_monster_feats"."is_bonus") = 'integer'),
	CONSTRAINT "dnd35_monster_feats_occurrence_valid" CHECK("dnd35_monster_feats"."occurrence" > 0),
	CONSTRAINT "dnd35_monster_feats_bonus_bool" CHECK("dnd35_monster_feats"."is_bonus" in (0, 1)),
	CONSTRAINT "dnd35_monster_feats_choices_json" CHECK(case when "dnd35_monster_feats"."choices" is null then 1 when json_valid("dnd35_monster_feats"."choices") then json_type("dnd35_monster_feats"."choices") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_monster_feats_occurrence_uq` ON `dnd35_monster_feats` (`monster_id`,`feat_id`,`occurrence`);--> statement-breakpoint
CREATE INDEX `dnd35_monster_feats_feat_idx` ON `dnd35_monster_feats` (`feat_id`);--> statement-breakpoint
CREATE TABLE `dnd35_monster_skills` (
	`monster_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`specialization` text DEFAULT '' NOT NULL,
	`ranks` real,
	`published_modifier` integer,
	`racial_bonus` integer DEFAULT 0 NOT NULL,
	`context` text,
	PRIMARY KEY(`monster_id`, `skill_id`, `specialization`),
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_monster_skills_published_modifier_integer" CHECK("dnd35_monster_skills"."published_modifier" is null or typeof("dnd35_monster_skills"."published_modifier") = 'integer'),
	CONSTRAINT "dnd35_monster_skills_racial_bonus_integer" CHECK("dnd35_monster_skills"."racial_bonus" is null or typeof("dnd35_monster_skills"."racial_bonus") = 'integer'),
	CONSTRAINT "dnd35_monster_skills_ranks_valid" CHECK("dnd35_monster_skills"."ranks" >= 0 and "dnd35_monster_skills"."ranks" * 2 = cast("dnd35_monster_skills"."ranks" * 2 as integer)),
	CONSTRAINT "dnd35_monster_skills_value_present" CHECK("dnd35_monster_skills"."ranks" is not null or "dnd35_monster_skills"."published_modifier" is not null)
);
--> statement-breakpoint
CREATE TABLE `dnd35_power_descriptor_assignments` (
	`power_id` text NOT NULL,
	`descriptor_id` text NOT NULL,
	PRIMARY KEY(`power_id`, `descriptor_id`),
	FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`descriptor_id`) REFERENCES `dnd35_spell_descriptors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_power_descriptors_reverse_idx` ON `dnd35_power_descriptor_assignments` (`descriptor_id`);--> statement-breakpoint
CREATE TABLE `dnd35_power_display_assignments` (
	`power_id` text NOT NULL,
	`display` text NOT NULL,
	`description` text,
	PRIMARY KEY(`power_id`, `display`),
	FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_power_displays_valid" CHECK("dnd35_power_display_assignments"."display" in ('auditory', 'material', 'mental', 'olfactory', 'visual'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_powers` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`discipline_id` text NOT NULL,
	`subdiscipline` text,
	`manifesting_time` text NOT NULL,
	`action_type` text,
	`range_text` text NOT NULL,
	`target_text` text,
	`area_text` text,
	`effect_text` text,
	`duration_text` text NOT NULL,
	`save` text,
	`saving_throw_text` text,
	`power_resistance` text NOT NULL,
	`power_resistance_text` text,
	`power_points` integer NOT NULL,
	`augmentation_text` text,
	`augmentation` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`discipline_id`) REFERENCES `dnd35_power_disciplines`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_powers_power_points_integer" CHECK("dnd35_powers"."power_points" is null or typeof("dnd35_powers"."power_points") = 'integer'),
	CONSTRAINT "dnd35_powers_slug_nonempty" CHECK(length(trim("dnd35_powers"."slug")) > 0),
	CONSTRAINT "dnd35_powers_name_nonempty" CHECK(length(trim("dnd35_powers"."name")) > 0),
	CONSTRAINT "dnd35_powers_owner_nonempty" CHECK(length(trim("dnd35_powers"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_powers_homebrew_bool" CHECK("dnd35_powers"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_powers_enabled_bool" CHECK("dnd35_powers"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_powers_points_valid" CHECK("dnd35_powers"."power_points" >= 0),
	CONSTRAINT "dnd35_powers_action_valid" CHECK("dnd35_powers"."action_type" in ('standard', 'move', 'full_round', 'free', 'swift', 'immediate', 'none', 'other')),
	CONSTRAINT "dnd35_powers_save_valid" CHECK("dnd35_powers"."save" in ('fort', 'ref', 'will')),
	CONSTRAINT "dnd35_powers_resistance_valid" CHECK("dnd35_powers"."power_resistance" in ('yes', 'no', 'conditional')),
	CONSTRAINT "dnd35_powers_time_nonempty" CHECK(length(trim("dnd35_powers"."manifesting_time")) > 0),
	CONSTRAINT "dnd35_powers_range_nonempty" CHECK(length(trim("dnd35_powers"."range_text")) > 0),
	CONSTRAINT "dnd35_powers_duration_nonempty" CHECK(length(trim("dnd35_powers"."duration_text")) > 0),
	CONSTRAINT "dnd35_powers_augmentation_json" CHECK(case when "dnd35_powers"."augmentation" is null then 1 when json_valid("dnd35_powers"."augmentation") then json_type("dnd35_powers"."augmentation") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_powers_source_slug_owner_uq` ON `dnd35_powers` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_powers_source_slug_shared_uq` ON `dnd35_powers` (`source_id`,`slug`) WHERE "dnd35_powers"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_powers_slug_idx` ON `dnd35_powers` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_powers_owner_idx` ON `dnd35_powers` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_powers_discipline_idx` ON `dnd35_powers` (`discipline_id`);--> statement-breakpoint
CREATE TABLE `dnd35_power_class_levels` (
	`power_id` text NOT NULL,
	`class_id` text NOT NULL,
	`power_level` integer NOT NULL,
	`specialist_discipline_id` text,
	PRIMARY KEY(`power_id`, `class_id`),
	FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`specialist_discipline_id`) REFERENCES `dnd35_power_disciplines`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_power_class_levels_power_level_integer" CHECK("dnd35_power_class_levels"."power_level" is null or typeof("dnd35_power_class_levels"."power_level") = 'integer'),
	CONSTRAINT "dnd35_power_class_levels_level_valid" CHECK("dnd35_power_class_levels"."power_level" between 1 and 9)
);
--> statement-breakpoint
CREATE INDEX `dnd35_power_class_levels_list_idx` ON `dnd35_power_class_levels` (`class_id`,`power_level`);--> statement-breakpoint
CREATE TABLE `dnd35_power_disciplines` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`specialist_name` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_power_disciplines_slug_nonempty" CHECK(length(trim("dnd35_power_disciplines"."slug")) > 0),
	CONSTRAINT "dnd35_power_disciplines_name_nonempty" CHECK(length(trim("dnd35_power_disciplines"."name")) > 0),
	CONSTRAINT "dnd35_power_disciplines_owner_nonempty" CHECK(length(trim("dnd35_power_disciplines"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_power_disciplines_homebrew_bool" CHECK("dnd35_power_disciplines"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_power_disciplines_enabled_bool" CHECK("dnd35_power_disciplines"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_power_disciplines_source_slug_owner_uq` ON `dnd35_power_disciplines` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_power_disciplines_source_slug_shared_uq` ON `dnd35_power_disciplines` (`source_id`,`slug`) WHERE "dnd35_power_disciplines"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_power_disciplines_slug_idx` ON `dnd35_power_disciplines` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_power_disciplines_owner_idx` ON `dnd35_power_disciplines` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_race_movements` (
	`race_id` text NOT NULL,
	`mode` text NOT NULL,
	`feet` integer,
	`base_speed_multiplier` real,
	`maneuverability` text,
	`rules_text` text,
	PRIMARY KEY(`race_id`, `mode`),
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_race_movements_feet_integer" CHECK("dnd35_race_movements"."feet" is null or typeof("dnd35_race_movements"."feet") = 'integer'),
	CONSTRAINT "dnd35_race_movements_mode_valid" CHECK("dnd35_race_movements"."mode" in ('land', 'climb', 'swim', 'fly', 'burrow', 'glide', 'other')),
	CONSTRAINT "dnd35_race_movements_no_land" CHECK("dnd35_race_movements"."mode" != 'land'),
	CONSTRAINT "dnd35_race_movements_flight_valid" CHECK("dnd35_race_movements"."maneuverability" in ('clumsy', 'poor', 'average', 'good', 'perfect')),
	CONSTRAINT "dnd35_race_movements_feet_valid" CHECK("dnd35_race_movements"."feet" >= 0),
	CONSTRAINT "dnd35_race_movements_multiplier_valid" CHECK("dnd35_race_movements"."base_speed_multiplier" > 0),
	CONSTRAINT "dnd35_race_movements_speed_present" CHECK(("dnd35_race_movements"."feet" is not null and "dnd35_race_movements"."base_speed_multiplier" is null) or ("dnd35_race_movements"."feet" is null and "dnd35_race_movements"."base_speed_multiplier" is not null))
);
--> statement-breakpoint
CREATE TABLE `dnd35_race_prerequisites` (
	`race_id` text PRIMARY KEY NOT NULL,
	`expression` text NOT NULL,
	`explanation` text,
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_race_prerequisites_json" CHECK(case when "dnd35_race_prerequisites"."expression" is null then 1 when json_valid("dnd35_race_prerequisites"."expression") then json_type("dnd35_race_prerequisites"."expression") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_race_subtypes` (
	`race_id` text NOT NULL,
	`subtype_id` text NOT NULL,
	PRIMARY KEY(`race_id`, `subtype_id`),
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtype_id`) REFERENCES `dnd35_creature_subtypes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_race_subtypes_reverse_idx` ON `dnd35_race_subtypes` (`subtype_id`);--> statement-breakpoint
CREATE TABLE `dnd35_races` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`creature_type_id` text,
	`favored_class_id` text,
	`favored_class_rule` text DEFAULT 'none' NOT NULL,
	`size` text NOT NULL,
	`base_speed_feet` integer NOT NULL,
	`level_adjustment` integer,
	`racial_hit_dice` integer DEFAULT 0 NOT NULL,
	`racial_hit_die` integer,
	`natural_armor` integer DEFAULT 0 NOT NULL,
	`bonus_skill_points_per_level` integer DEFAULT 0 NOT NULL,
	`bonus_feats_at_first_level` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`creature_type_id`) REFERENCES `dnd35_creature_types`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`favored_class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_races_base_speed_feet_integer" CHECK("dnd35_races"."base_speed_feet" is null or typeof("dnd35_races"."base_speed_feet") = 'integer'),
	CONSTRAINT "dnd35_races_level_adjustment_integer" CHECK("dnd35_races"."level_adjustment" is null or typeof("dnd35_races"."level_adjustment") = 'integer'),
	CONSTRAINT "dnd35_races_racial_hit_dice_integer" CHECK("dnd35_races"."racial_hit_dice" is null or typeof("dnd35_races"."racial_hit_dice") = 'integer'),
	CONSTRAINT "dnd35_races_racial_hit_die_integer" CHECK("dnd35_races"."racial_hit_die" is null or typeof("dnd35_races"."racial_hit_die") = 'integer'),
	CONSTRAINT "dnd35_races_natural_armor_integer" CHECK("dnd35_races"."natural_armor" is null or typeof("dnd35_races"."natural_armor") = 'integer'),
	CONSTRAINT "dnd35_races_bonus_skill_points_per_level_integer" CHECK("dnd35_races"."bonus_skill_points_per_level" is null or typeof("dnd35_races"."bonus_skill_points_per_level") = 'integer'),
	CONSTRAINT "dnd35_races_bonus_feats_at_first_level_integer" CHECK("dnd35_races"."bonus_feats_at_first_level" is null or typeof("dnd35_races"."bonus_feats_at_first_level") = 'integer'),
	CONSTRAINT "dnd35_races_slug_nonempty" CHECK(length(trim("dnd35_races"."slug")) > 0),
	CONSTRAINT "dnd35_races_name_nonempty" CHECK(length(trim("dnd35_races"."name")) > 0),
	CONSTRAINT "dnd35_races_owner_nonempty" CHECK(length(trim("dnd35_races"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_races_homebrew_bool" CHECK("dnd35_races"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_races_enabled_bool" CHECK("dnd35_races"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_races_size_valid" CHECK("dnd35_races"."size" in ('fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal')),
	CONSTRAINT "dnd35_races_favored_rule_valid" CHECK("dnd35_races"."favored_class_rule" in ('specific', 'highest', 'choice', 'none')),
	CONSTRAINT "dnd35_races_favored_class_valid" CHECK(("dnd35_races"."favored_class_rule" = 'specific' and "dnd35_races"."favored_class_id" is not null) or ("dnd35_races"."favored_class_rule" != 'specific' and "dnd35_races"."favored_class_id" is null)),
	CONSTRAINT "dnd35_races_speed_valid" CHECK("dnd35_races"."base_speed_feet" >= 0),
	CONSTRAINT "dnd35_races_la_valid" CHECK("dnd35_races"."level_adjustment" >= 0),
	CONSTRAINT "dnd35_races_rhd_valid" CHECK("dnd35_races"."racial_hit_dice" >= 0),
	CONSTRAINT "dnd35_races_hd_valid" CHECK("dnd35_races"."racial_hit_die" > 0),
	CONSTRAINT "dnd35_races_hd_present" CHECK("dnd35_races"."racial_hit_dice" = 0 or "dnd35_races"."racial_hit_die" is not null),
	CONSTRAINT "dnd35_races_bonus_skills_valid" CHECK("dnd35_races"."bonus_skill_points_per_level" >= 0),
	CONSTRAINT "dnd35_races_bonus_feats_valid" CHECK("dnd35_races"."bonus_feats_at_first_level" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_races_source_slug_owner_uq` ON `dnd35_races` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_races_source_slug_shared_uq` ON `dnd35_races` (`source_id`,`slug`) WHERE "dnd35_races"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_races_slug_idx` ON `dnd35_races` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_races_owner_idx` ON `dnd35_races` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_races_type_idx` ON `dnd35_races` (`creature_type_id`);--> statement-breakpoint
CREATE TABLE `dnd35_race_abilities` (
	`race_id` text NOT NULL,
	`ability` text NOT NULL,
	`modifier` integer NOT NULL,
	PRIMARY KEY(`race_id`, `ability`),
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_race_abilities_modifier_integer" CHECK("dnd35_race_abilities"."modifier" is null or typeof("dnd35_race_abilities"."modifier") = 'integer'),
	CONSTRAINT "dnd35_race_abilities_key_valid" CHECK("dnd35_race_abilities"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_race_languages` (
	`race_id` text NOT NULL,
	`language_id` text NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`race_id`, `language_id`),
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`language_id`) REFERENCES `dnd35_languages`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_race_languages_kind_valid" CHECK("dnd35_race_languages"."kind" in ('automatic', 'bonus'))
);
--> statement-breakpoint
CREATE INDEX `dnd35_race_languages_reverse_idx` ON `dnd35_race_languages` (`language_id`);--> statement-breakpoint
CREATE TABLE `dnd35_race_traits` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`special_ability_id` text,
	`name` text NOT NULL,
	`rules_text` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`parameters` text,
	`effects` text,
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_race_traits_position_integer" CHECK("dnd35_race_traits"."position" is null or typeof("dnd35_race_traits"."position") = 'integer'),
	CONSTRAINT "dnd35_race_traits_name_nonempty" CHECK(length(trim("dnd35_race_traits"."name")) > 0),
	CONSTRAINT "dnd35_race_traits_position_valid" CHECK("dnd35_race_traits"."position" >= 0),
	CONSTRAINT "dnd35_race_traits_parameters_json" CHECK(case when "dnd35_race_traits"."parameters" is null then 1 when json_valid("dnd35_race_traits"."parameters") then json_type("dnd35_race_traits"."parameters") = 'object' else 0 end),
	CONSTRAINT "dnd35_race_traits_effects_json" CHECK(case when "dnd35_race_traits"."effects" is null then 1 when json_valid("dnd35_race_traits"."effects") then json_type("dnd35_race_traits"."effects") = 'array' else 0 end)
);
--> statement-breakpoint
CREATE INDEX `dnd35_race_traits_race_idx` ON `dnd35_race_traits` (`race_id`,`position`);--> statement-breakpoint
CREATE TABLE `dnd35_shields` (
	`item_id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`ac_bonus` integer NOT NULL,
	`max_dex_bonus` integer,
	`armor_check_penalty` integer DEFAULT 0 NOT NULL,
	`arcane_spell_failure_percent` integer DEFAULT 0 NOT NULL,
	`speed_at_30_feet` integer,
	`speed_at_20_feet` integer,
	`special_text` text,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_shields_ac_bonus_integer" CHECK("dnd35_shields"."ac_bonus" is null or typeof("dnd35_shields"."ac_bonus") = 'integer'),
	CONSTRAINT "dnd35_shields_max_dex_bonus_integer" CHECK("dnd35_shields"."max_dex_bonus" is null or typeof("dnd35_shields"."max_dex_bonus") = 'integer'),
	CONSTRAINT "dnd35_shields_armor_check_penalty_integer" CHECK("dnd35_shields"."armor_check_penalty" is null or typeof("dnd35_shields"."armor_check_penalty") = 'integer'),
	CONSTRAINT "dnd35_shields_arcane_spell_failure_percent_integer" CHECK("dnd35_shields"."arcane_spell_failure_percent" is null or typeof("dnd35_shields"."arcane_spell_failure_percent") = 'integer'),
	CONSTRAINT "dnd35_shields_speed_at_30_feet_integer" CHECK("dnd35_shields"."speed_at_30_feet" is null or typeof("dnd35_shields"."speed_at_30_feet") = 'integer'),
	CONSTRAINT "dnd35_shields_speed_at_20_feet_integer" CHECK("dnd35_shields"."speed_at_20_feet" is null or typeof("dnd35_shields"."speed_at_20_feet") = 'integer'),
	CONSTRAINT "dnd35_shields_category_valid" CHECK("dnd35_shields"."category" in ('buckler', 'light', 'heavy', 'tower', 'other')),
	CONSTRAINT "dnd35_shields_ac_valid" CHECK("dnd35_shields"."ac_bonus" >= 0),
	CONSTRAINT "dnd35_shields_dex_valid" CHECK("dnd35_shields"."max_dex_bonus" >= 0),
	CONSTRAINT "dnd35_shields_penalty_valid" CHECK("dnd35_shields"."armor_check_penalty" <= 0),
	CONSTRAINT "dnd35_shields_failure_valid" CHECK("dnd35_shields"."arcane_spell_failure_percent" between 0 and 100),
	CONSTRAINT "dnd35_shields_speed30_valid" CHECK("dnd35_shields"."speed_at_30_feet" >= 0),
	CONSTRAINT "dnd35_shields_speed20_valid" CHECK("dnd35_shields"."speed_at_20_feet" >= 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ability` text,
	`trained_only` integer DEFAULT false NOT NULL,
	`armor_check_multiplier` integer DEFAULT 0 NOT NULL,
	`requires_specialization` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_skills_trained_only_integer" CHECK("dnd35_skills"."trained_only" is null or typeof("dnd35_skills"."trained_only") = 'integer'),
	CONSTRAINT "dnd35_skills_armor_check_multiplier_integer" CHECK("dnd35_skills"."armor_check_multiplier" is null or typeof("dnd35_skills"."armor_check_multiplier") = 'integer'),
	CONSTRAINT "dnd35_skills_requires_specialization_integer" CHECK("dnd35_skills"."requires_specialization" is null or typeof("dnd35_skills"."requires_specialization") = 'integer'),
	CONSTRAINT "dnd35_skills_slug_nonempty" CHECK(length(trim("dnd35_skills"."slug")) > 0),
	CONSTRAINT "dnd35_skills_name_nonempty" CHECK(length(trim("dnd35_skills"."name")) > 0),
	CONSTRAINT "dnd35_skills_owner_nonempty" CHECK(length(trim("dnd35_skills"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_skills_homebrew_bool" CHECK("dnd35_skills"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_skills_enabled_bool" CHECK("dnd35_skills"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_skills_ability_valid" CHECK("dnd35_skills"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
	CONSTRAINT "dnd35_skills_trained_bool" CHECK("dnd35_skills"."trained_only" in (0, 1)),
	CONSTRAINT "dnd35_skills_specialization_bool" CHECK("dnd35_skills"."requires_specialization" in (0, 1)),
	CONSTRAINT "dnd35_skills_armor_multiplier_valid" CHECK("dnd35_skills"."armor_check_multiplier" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_skills_source_slug_owner_uq` ON `dnd35_skills` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_skills_source_slug_shared_uq` ON `dnd35_skills` (`source_id`,`slug`) WHERE "dnd35_skills"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_skills_slug_idx` ON `dnd35_skills` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_skills_owner_idx` ON `dnd35_skills` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_skill_synergies` (
	`id` text PRIMARY KEY NOT NULL,
	`from_skill_id` text NOT NULL,
	`to_skill_id` text NOT NULL,
	`minimum_ranks` real DEFAULT 5 NOT NULL,
	`bonus` integer DEFAULT 2 NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`from_skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_skill_synergies_bonus_integer" CHECK("dnd35_skill_synergies"."bonus" is null or typeof("dnd35_skill_synergies"."bonus") = 'integer'),
	CONSTRAINT "dnd35_skill_synergies_ranks_valid" CHECK("dnd35_skill_synergies"."minimum_ranks" >= 0 and "dnd35_skill_synergies"."minimum_ranks" * 2 = cast("dnd35_skill_synergies"."minimum_ranks" * 2 as integer)),
	CONSTRAINT "dnd35_skill_synergies_bonus_valid" CHECK("dnd35_skill_synergies"."bonus" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_skill_synergies_edge_uq` ON `dnd35_skill_synergies` (`from_skill_id`,`to_skill_id`,`context`);--> statement-breakpoint
CREATE INDEX `dnd35_skill_synergies_target_idx` ON `dnd35_skill_synergies` (`to_skill_id`);--> statement-breakpoint
CREATE TABLE `dnd35_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text,
	`publisher` text,
	`system` text DEFAULT 'dnd' NOT NULL,
	`edition` text DEFAULT '3.5' NOT NULL,
	`description` text,
	`url` text,
	`is_official` integer DEFAULT false NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "dnd35_sources_is_official_integer" CHECK("dnd35_sources"."is_official" is null or typeof("dnd35_sources"."is_official") = 'integer'),
	CONSTRAINT "dnd35_sources_is_homebrew_integer" CHECK("dnd35_sources"."is_homebrew" is null or typeof("dnd35_sources"."is_homebrew") = 'integer'),
	CONSTRAINT "dnd35_sources_slug_nonempty" CHECK(length(trim("dnd35_sources"."slug")) > 0),
	CONSTRAINT "dnd35_sources_name_nonempty" CHECK(length(trim("dnd35_sources"."name")) > 0),
	CONSTRAINT "dnd35_sources_owner_nonempty" CHECK(length(trim("dnd35_sources"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_sources_official_bool" CHECK("dnd35_sources"."is_official" in (0, 1)),
	CONSTRAINT "dnd35_sources_homebrew_bool" CHECK("dnd35_sources"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_sources_origin_valid" CHECK(not ("dnd35_sources"."is_official" = 1 and "dnd35_sources"."is_homebrew" = 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_sources_slug_owner_uq` ON `dnd35_sources` (`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_sources_slug_shared_uq` ON `dnd35_sources` (`slug`) WHERE "dnd35_sources"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_sources_owner_idx` ON `dnd35_sources` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_special_abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`category` text NOT NULL,
	`action_type` text,
	`effects` text,
	`parameters` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_special_abilities_slug_nonempty" CHECK(length(trim("dnd35_special_abilities"."slug")) > 0),
	CONSTRAINT "dnd35_special_abilities_name_nonempty" CHECK(length(trim("dnd35_special_abilities"."name")) > 0),
	CONSTRAINT "dnd35_special_abilities_owner_nonempty" CHECK(length(trim("dnd35_special_abilities"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_special_abilities_homebrew_bool" CHECK("dnd35_special_abilities"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_special_abilities_enabled_bool" CHECK("dnd35_special_abilities"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_special_abilities_category_valid" CHECK("dnd35_special_abilities"."category" in ('extraordinary', 'supernatural', 'spell_like', 'psi_like', 'natural', 'other')),
	CONSTRAINT "dnd35_special_abilities_action_valid" CHECK("dnd35_special_abilities"."action_type" in ('standard', 'move', 'full_round', 'free', 'swift', 'immediate', 'none', 'other')),
	CONSTRAINT "dnd35_special_abilities_effects_json" CHECK(case when "dnd35_special_abilities"."effects" is null then 1 when json_valid("dnd35_special_abilities"."effects") then json_type("dnd35_special_abilities"."effects") = 'array' else 0 end),
	CONSTRAINT "dnd35_special_abilities_parameters_json" CHECK(case when "dnd35_special_abilities"."parameters" is null then 1 when json_valid("dnd35_special_abilities"."parameters") then json_type("dnd35_special_abilities"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_special_abilities_source_slug_owner_uq` ON `dnd35_special_abilities` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_special_abilities_source_slug_shared_uq` ON `dnd35_special_abilities` (`source_id`,`slug`) WHERE "dnd35_special_abilities"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_special_abilities_slug_idx` ON `dnd35_special_abilities` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_special_abilities_owner_idx` ON `dnd35_special_abilities` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_prerequisites` (
	`spell_id` text PRIMARY KEY NOT NULL,
	`expression` text NOT NULL,
	`explanation` text,
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_spell_prerequisites_json" CHECK(case when "dnd35_spell_prerequisites"."expression" is null then 1 when json_valid("dnd35_spell_prerequisites"."expression") then json_type("dnd35_spell_prerequisites"."expression") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_spells` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`school_id` text NOT NULL,
	`subschool` text,
	`casting_time` text NOT NULL,
	`action_type` text,
	`range_text` text NOT NULL,
	`target_text` text,
	`area_text` text,
	`effect_text` text,
	`duration_text` text NOT NULL,
	`saving_throw_text` text,
	`save` text,
	`spell_resistance` text NOT NULL,
	`spell_resistance_text` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`school_id`) REFERENCES `dnd35_spell_schools`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_spells_slug_nonempty" CHECK(length(trim("dnd35_spells"."slug")) > 0),
	CONSTRAINT "dnd35_spells_name_nonempty" CHECK(length(trim("dnd35_spells"."name")) > 0),
	CONSTRAINT "dnd35_spells_owner_nonempty" CHECK(length(trim("dnd35_spells"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_spells_homebrew_bool" CHECK("dnd35_spells"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_spells_enabled_bool" CHECK("dnd35_spells"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_spells_action_valid" CHECK("dnd35_spells"."action_type" in ('standard', 'move', 'full_round', 'free', 'swift', 'immediate', 'none', 'other')),
	CONSTRAINT "dnd35_spells_save_valid" CHECK("dnd35_spells"."save" in ('fort', 'ref', 'will')),
	CONSTRAINT "dnd35_spells_resistance_valid" CHECK("dnd35_spells"."spell_resistance" in ('yes', 'no', 'conditional')),
	CONSTRAINT "dnd35_spells_casting_time_nonempty" CHECK(length(trim("dnd35_spells"."casting_time")) > 0),
	CONSTRAINT "dnd35_spells_range_nonempty" CHECK(length(trim("dnd35_spells"."range_text")) > 0),
	CONSTRAINT "dnd35_spells_duration_nonempty" CHECK(length(trim("dnd35_spells"."duration_text")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spells_source_slug_owner_uq` ON `dnd35_spells` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spells_source_slug_shared_uq` ON `dnd35_spells` (`source_id`,`slug`) WHERE "dnd35_spells"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_spells_slug_idx` ON `dnd35_spells` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_spells_owner_idx` ON `dnd35_spells` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dnd35_spells_school_idx` ON `dnd35_spells` (`school_id`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_class_levels` (
	`spell_id` text NOT NULL,
	`class_id` text NOT NULL,
	`spell_level` integer NOT NULL,
	PRIMARY KEY(`spell_id`, `class_id`),
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_spell_class_levels_spell_level_integer" CHECK("dnd35_spell_class_levels"."spell_level" is null or typeof("dnd35_spell_class_levels"."spell_level") = 'integer'),
	CONSTRAINT "dnd35_spell_class_levels_level_valid" CHECK("dnd35_spell_class_levels"."spell_level" between 0 and 9)
);
--> statement-breakpoint
CREATE INDEX `dnd35_spell_class_levels_list_idx` ON `dnd35_spell_class_levels` (`class_id`,`spell_level`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_components` (
	`id` text PRIMARY KEY NOT NULL,
	`spell_id` text NOT NULL,
	`code` text NOT NULL,
	`alternative_group` text DEFAULT '' NOT NULL,
	`description` text,
	`cost_copper` integer,
	`xp_cost` integer,
	`is_consumed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_spell_components_cost_copper_integer" CHECK("dnd35_spell_components"."cost_copper" is null or typeof("dnd35_spell_components"."cost_copper") = 'integer'),
	CONSTRAINT "dnd35_spell_components_xp_cost_integer" CHECK("dnd35_spell_components"."xp_cost" is null or typeof("dnd35_spell_components"."xp_cost") = 'integer'),
	CONSTRAINT "dnd35_spell_components_is_consumed_integer" CHECK("dnd35_spell_components"."is_consumed" is null or typeof("dnd35_spell_components"."is_consumed") = 'integer'),
	CONSTRAINT "dnd35_spell_components_code_valid" CHECK("dnd35_spell_components"."code" in ('V', 'S', 'M', 'F', 'DF', 'XP')),
	CONSTRAINT "dnd35_spell_components_cost_valid" CHECK("dnd35_spell_components"."cost_copper" >= 0),
	CONSTRAINT "dnd35_spell_components_xp_valid" CHECK("dnd35_spell_components"."xp_cost" >= 0),
	CONSTRAINT "dnd35_spell_components_consumed_bool" CHECK("dnd35_spell_components"."is_consumed" in (0, 1)),
	CONSTRAINT "dnd35_spell_components_xp_kind_valid" CHECK("dnd35_spell_components"."xp_cost" is null or "dnd35_spell_components"."code" = 'XP'),
	CONSTRAINT "dnd35_spell_components_cost_kind_valid" CHECK("dnd35_spell_components"."cost_copper" is null or "dnd35_spell_components"."code" in ('M', 'F', 'DF'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_components_code_group_uq` ON `dnd35_spell_components` (`spell_id`,`code`,`alternative_group`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_descriptor_assignments` (
	`spell_id` text NOT NULL,
	`descriptor_id` text NOT NULL,
	PRIMARY KEY(`spell_id`, `descriptor_id`),
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`descriptor_id`) REFERENCES `dnd35_spell_descriptors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dnd35_spell_descriptors_reverse_idx` ON `dnd35_spell_descriptor_assignments` (`descriptor_id`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_descriptors` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_spell_descriptors_slug_nonempty" CHECK(length(trim("dnd35_spell_descriptors"."slug")) > 0),
	CONSTRAINT "dnd35_spell_descriptors_name_nonempty" CHECK(length(trim("dnd35_spell_descriptors"."name")) > 0),
	CONSTRAINT "dnd35_spell_descriptors_owner_nonempty" CHECK(length(trim("dnd35_spell_descriptors"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_spell_descriptors_homebrew_bool" CHECK("dnd35_spell_descriptors"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_spell_descriptors_enabled_bool" CHECK("dnd35_spell_descriptors"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_descriptors_source_slug_owner_uq` ON `dnd35_spell_descriptors` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_descriptors_source_slug_shared_uq` ON `dnd35_spell_descriptors` (`source_id`,`slug`) WHERE "dnd35_spell_descriptors"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_spell_descriptors_slug_idx` ON `dnd35_spell_descriptors` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_spell_descriptors_owner_idx` ON `dnd35_spell_descriptors` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_domain_levels` (
	`spell_id` text NOT NULL,
	`domain_id` text NOT NULL,
	`spell_level` integer NOT NULL,
	PRIMARY KEY(`spell_id`, `domain_id`),
	FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `dnd35_domains`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_spell_domain_levels_spell_level_integer" CHECK("dnd35_spell_domain_levels"."spell_level" is null or typeof("dnd35_spell_domain_levels"."spell_level") = 'integer'),
	CONSTRAINT "dnd35_spell_domain_levels_level_valid" CHECK("dnd35_spell_domain_levels"."spell_level" between 1 and 9)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_domain_levels_slot_uq` ON `dnd35_spell_domain_levels` (`domain_id`,`spell_level`);--> statement-breakpoint
CREATE TABLE `dnd35_spell_schools` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`specialization_text` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_spell_schools_slug_nonempty" CHECK(length(trim("dnd35_spell_schools"."slug")) > 0),
	CONSTRAINT "dnd35_spell_schools_name_nonempty" CHECK(length(trim("dnd35_spell_schools"."name")) > 0),
	CONSTRAINT "dnd35_spell_schools_owner_nonempty" CHECK(length(trim("dnd35_spell_schools"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_spell_schools_homebrew_bool" CHECK("dnd35_spell_schools"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_spell_schools_enabled_bool" CHECK("dnd35_spell_schools"."is_enabled" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_schools_source_slug_owner_uq` ON `dnd35_spell_schools` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_spell_schools_source_slug_shared_uq` ON `dnd35_spell_schools` (`source_id`,`slug`) WHERE "dnd35_spell_schools"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_spell_schools_slug_idx` ON `dnd35_spell_schools` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_spell_schools_owner_idx` ON `dnd35_spell_schools` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_monster_templates` (
	`monster_id` text NOT NULL,
	`template_id` text NOT NULL,
	`application_order` integer NOT NULL,
	PRIMARY KEY(`monster_id`, `template_id`),
	FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `dnd35_templates`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_monster_templates_application_order_integer" CHECK("dnd35_monster_templates"."application_order" is null or typeof("dnd35_monster_templates"."application_order") = 'integer'),
	CONSTRAINT "dnd35_monster_templates_order_valid" CHECK("dnd35_monster_templates"."application_order" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_monster_templates_order_uq` ON `dnd35_monster_templates` (`monster_id`,`application_order`);--> statement-breakpoint
CREATE TABLE `dnd35_template_abilities` (
	`template_id` text NOT NULL,
	`special_ability_id` text NOT NULL,
	`parameters` text,
	PRIMARY KEY(`template_id`, `special_ability_id`),
	FOREIGN KEY (`template_id`) REFERENCES `dnd35_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`special_ability_id`) REFERENCES `dnd35_special_abilities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_template_abilities_parameters_json" CHECK(case when "dnd35_template_abilities"."parameters" is null then 1 when json_valid("dnd35_template_abilities"."parameters") then json_type("dnd35_template_abilities"."parameters") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE TABLE `dnd35_template_ability_modifiers` (
	`template_id` text NOT NULL,
	`ability` text NOT NULL,
	`modifier` integer NOT NULL,
	PRIMARY KEY(`template_id`, `ability`),
	FOREIGN KEY (`template_id`) REFERENCES `dnd35_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_template_ability_modifiers_modifier_integer" CHECK("dnd35_template_ability_modifiers"."modifier" is null or typeof("dnd35_template_ability_modifiers"."modifier") = 'integer'),
	CONSTRAINT "dnd35_template_abilities_key_valid" CHECK("dnd35_template_ability_modifiers"."ability" in ('str', 'dex', 'con', 'int', 'wis', 'cha'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_template_subtypes` (
	`template_id` text NOT NULL,
	`subtype_id` text NOT NULL,
	`operation` text DEFAULT 'add' NOT NULL,
	PRIMARY KEY(`template_id`, `subtype_id`),
	FOREIGN KEY (`template_id`) REFERENCES `dnd35_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtype_id`) REFERENCES `dnd35_creature_subtypes`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_template_subtypes_operation_valid" CHECK("dnd35_template_subtypes"."operation" in ('add', 'remove'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_page` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rules_text` text DEFAULT '' NOT NULL,
	`is_homebrew` integer DEFAULT false NOT NULL,
	`owner_user_id` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`result_creature_type_id` text,
	`kind` text NOT NULL,
	`challenge_rating_adjustment` real,
	`level_adjustment` integer,
	`natural_armor_adjustment` integer DEFAULT 0 NOT NULL,
	`transformations` text,
	`applicability` text,
	FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`result_creature_type_id`) REFERENCES `dnd35_creature_types`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dnd35_templates_level_adjustment_integer" CHECK("dnd35_templates"."level_adjustment" is null or typeof("dnd35_templates"."level_adjustment") = 'integer'),
	CONSTRAINT "dnd35_templates_natural_armor_adjustment_integer" CHECK("dnd35_templates"."natural_armor_adjustment" is null or typeof("dnd35_templates"."natural_armor_adjustment") = 'integer'),
	CONSTRAINT "dnd35_templates_slug_nonempty" CHECK(length(trim("dnd35_templates"."slug")) > 0),
	CONSTRAINT "dnd35_templates_name_nonempty" CHECK(length(trim("dnd35_templates"."name")) > 0),
	CONSTRAINT "dnd35_templates_owner_nonempty" CHECK(length(trim("dnd35_templates"."owner_user_id")) > 0),
	CONSTRAINT "dnd35_templates_homebrew_bool" CHECK("dnd35_templates"."is_homebrew" in (0, 1)),
	CONSTRAINT "dnd35_templates_enabled_bool" CHECK("dnd35_templates"."is_enabled" in (0, 1)),
	CONSTRAINT "dnd35_templates_kind_valid" CHECK("dnd35_templates"."kind" in ('inherited', 'acquired', 'either')),
	CONSTRAINT "dnd35_templates_la_valid" CHECK("dnd35_templates"."level_adjustment" >= 0),
	CONSTRAINT "dnd35_templates_transformations_json" CHECK(case when "dnd35_templates"."transformations" is null then 1 when json_valid("dnd35_templates"."transformations") then json_type("dnd35_templates"."transformations") = 'array' else 0 end),
	CONSTRAINT "dnd35_templates_applicability_json" CHECK(case when "dnd35_templates"."applicability" is null then 1 when json_valid("dnd35_templates"."applicability") then json_type("dnd35_templates"."applicability") = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_templates_source_slug_owner_uq` ON `dnd35_templates` (`source_id`,`slug`,`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_templates_source_slug_shared_uq` ON `dnd35_templates` (`source_id`,`slug`) WHERE "dnd35_templates"."owner_user_id" is null;--> statement-breakpoint
CREATE INDEX `dnd35_templates_slug_idx` ON `dnd35_templates` (`slug`);--> statement-breakpoint
CREATE INDEX `dnd35_templates_owner_idx` ON `dnd35_templates` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `dnd35_weapon_damage` (
	`weapon_id` text NOT NULL,
	`size` text NOT NULL,
	`weapon_end` integer DEFAULT 1 NOT NULL,
	`dice` text NOT NULL,
	PRIMARY KEY(`weapon_id`, `size`, `weapon_end`),
	FOREIGN KEY (`weapon_id`) REFERENCES `dnd35_weapons`(`item_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_weapon_damage_weapon_end_integer" CHECK("dnd35_weapon_damage"."weapon_end" is null or typeof("dnd35_weapon_damage"."weapon_end") = 'integer'),
	CONSTRAINT "dnd35_weapon_damage_size_valid" CHECK("dnd35_weapon_damage"."size" in ('fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal')),
	CONSTRAINT "dnd35_weapon_damage_end_valid" CHECK("dnd35_weapon_damage"."weapon_end" > 0),
	CONSTRAINT "dnd35_weapon_damage_dice_nonempty" CHECK(length(trim("dnd35_weapon_damage"."dice")) > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_weapon_damage_types` (
	`weapon_id` text NOT NULL,
	`damage_type` text NOT NULL,
	PRIMARY KEY(`weapon_id`, `damage_type`),
	FOREIGN KEY (`weapon_id`) REFERENCES `dnd35_weapons`(`item_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_weapon_damage_types_valid" CHECK("dnd35_weapon_damage_types"."damage_type" in ('bludgeoning', 'piercing', 'slashing', 'acid', 'cold', 'electricity', 'fire', 'sonic', 'force', 'positive_energy', 'negative_energy', 'untyped'))
);
--> statement-breakpoint
CREATE TABLE `dnd35_weapons` (
	`item_id` text PRIMARY KEY NOT NULL,
	`proficiency` text NOT NULL,
	`handedness` text NOT NULL,
	`attack_kind` text NOT NULL,
	`critical_threat_minimum` integer DEFAULT 20 NOT NULL,
	`critical_multiplier` integer DEFAULT 2 NOT NULL,
	`range_increment_feet` integer,
	`reach_feet` integer,
	`is_reach` integer DEFAULT false NOT NULL,
	`damage_type_mode` text DEFAULT 'and' NOT NULL,
	`special_text` text,
	FOREIGN KEY (`item_id`) REFERENCES `dnd35_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_weapons_critical_threat_minimum_integer" CHECK("dnd35_weapons"."critical_threat_minimum" is null or typeof("dnd35_weapons"."critical_threat_minimum") = 'integer'),
	CONSTRAINT "dnd35_weapons_critical_multiplier_integer" CHECK("dnd35_weapons"."critical_multiplier" is null or typeof("dnd35_weapons"."critical_multiplier") = 'integer'),
	CONSTRAINT "dnd35_weapons_range_increment_feet_integer" CHECK("dnd35_weapons"."range_increment_feet" is null or typeof("dnd35_weapons"."range_increment_feet") = 'integer'),
	CONSTRAINT "dnd35_weapons_reach_feet_integer" CHECK("dnd35_weapons"."reach_feet" is null or typeof("dnd35_weapons"."reach_feet") = 'integer'),
	CONSTRAINT "dnd35_weapons_is_reach_integer" CHECK("dnd35_weapons"."is_reach" is null or typeof("dnd35_weapons"."is_reach") = 'integer'),
	CONSTRAINT "dnd35_weapons_proficiency_valid" CHECK("dnd35_weapons"."proficiency" in ('simple', 'martial', 'exotic')),
	CONSTRAINT "dnd35_weapons_handedness_valid" CHECK("dnd35_weapons"."handedness" in ('light', 'one_handed', 'two_handed', 'ranged')),
	CONSTRAINT "dnd35_weapons_kind_valid" CHECK("dnd35_weapons"."attack_kind" in ('melee', 'ranged', 'both')),
	CONSTRAINT "dnd35_weapons_damage_mode_valid" CHECK("dnd35_weapons"."damage_type_mode" in ('and', 'or')),
	CONSTRAINT "dnd35_weapons_critical_valid" CHECK("dnd35_weapons"."critical_threat_minimum" between 2 and 20 and "dnd35_weapons"."critical_multiplier" >= 2),
	CONSTRAINT "dnd35_weapons_range_valid" CHECK("dnd35_weapons"."range_increment_feet" > 0),
	CONSTRAINT "dnd35_weapons_reach_valid" CHECK("dnd35_weapons"."reach_feet" >= 0),
	CONSTRAINT "dnd35_weapons_reach_bool" CHECK("dnd35_weapons"."is_reach" in (0, 1))
);
