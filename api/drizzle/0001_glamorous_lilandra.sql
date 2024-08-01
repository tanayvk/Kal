CREATE TABLE `lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscriber` integer,
	`list` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text,
	FOREIGN KEY (`subscriber`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`list`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscription_list_idx` ON `subscriptions` (`list`);--> statement-breakpoint
CREATE INDEX `subscription_sub_idx` ON `subscriptions` (`subscriber`);--> statement-breakpoint
CREATE INDEX `events_status_time_idx` ON `events` (`status`,`time`);--> statement-breakpoint
CREATE INDEX `sender_smtp_idx` ON `senders` (`smtpServer`);--> statement-breakpoint
CREATE INDEX `sending_status_idx` ON `sending_queue` (`status`);--> statement-breakpoint
CREATE INDEX `sub_email_idx` ON `subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `sub_status_idx` ON `subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `users` (`username`);