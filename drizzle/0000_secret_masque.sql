CREATE TABLE `article_categories` (
	`article_uuid` text NOT NULL,
	`category` text NOT NULL,
	PRIMARY KEY(`article_uuid`, `category`),
	FOREIGN KEY (`article_uuid`) REFERENCES `articles`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`uuid` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`publisher` text,
	`published_at` text,
	`thumbnail` text,
	`original_url` text,
	`body` text,
	`authors` text,
	`language` text DEFAULT 'pt-419',
	`country` text DEFAULT 'BR',
	`fetched_at` text,
	`details_fetched` integer DEFAULT false
);
