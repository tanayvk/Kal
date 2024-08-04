CREATE TABLE `tracking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` integer,
	`sub` integer,
	`type` text,
	`url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text
);
--> statement-breakpoint
ALTER TABLE `config` ADD `open_tracking` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `config` ADD `link_tracking` integer DEFAULT true;