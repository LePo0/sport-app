CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`metricType` text NOT NULL,
	`mediaPath` text,
	`mediaType` text
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`heightCm` real
);
--> statement-breakpoint
CREATE TABLE `programSteps` (
	`id` text PRIMARY KEY NOT NULL,
	`programId` text NOT NULL,
	`stepType` text NOT NULL,
	`exerciseId` text,
	`orderIndex` integer NOT NULL,
	`sets` integer,
	`reps` integer,
	`durationSeconds` integer,
	FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rounds` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`programId` text NOT NULL,
	`date` integer NOT NULL,
	`totalDurationSeconds` integer NOT NULL,
	FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weightEntries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`weightKg` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weightEntries_date_unique` ON `weightEntries` (`date`);