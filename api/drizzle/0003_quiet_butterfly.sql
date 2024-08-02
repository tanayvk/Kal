ALTER TABLE `config` ADD `title` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `config` ADD `description` text DEFAULT '';--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_subscriber_list_unique` ON `subscriptions` (`subscriber`,`list`);