CREATE TABLE `user_favorites` (
	`user_id` integer NOT NULL,
	`article_uuid` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `article_uuid`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_uuid`) REFERENCES `articles`(`uuid`) ON UPDATE no action ON DELETE cascade
);
