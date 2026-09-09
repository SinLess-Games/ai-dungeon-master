CREATE TABLE `dnd35_feat_category_assignments_new` (
	`feat_id` text NOT NULL,
	`category` text NOT NULL,
	PRIMARY KEY(`feat_id`, `category`),
	FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dnd35_feat_categories_valid" CHECK("dnd35_feat_category_assignments_new"."category" in ('general', 'fighter', 'metamagic', 'item_creation', 'psionic', 'epic', 'racial', 'divine', 'wild', 'heritage', 'ceremony', 'combat_form', 'tactical', 'reserve', 'incarnum', 'vile', 'exalted', 'other'))
);
--> statement-breakpoint
INSERT INTO `dnd35_feat_category_assignments_new` (`feat_id`, `category`)
SELECT `feat_id`, `category` FROM `dnd35_feat_category_assignments`;
--> statement-breakpoint
DROP TABLE `dnd35_feat_category_assignments`;
--> statement-breakpoint
ALTER TABLE `dnd35_feat_category_assignments_new` RENAME TO `dnd35_feat_category_assignments`;
--> statement-breakpoint
CREATE INDEX `dnd35_feat_categories_category_idx` ON `dnd35_feat_category_assignments` (`category`);
