ALTER TABLE
    `sessions`
ADD
    `programName` text NOT NULL DEFAULT '';

--> statement-breakpoint
CREATE TABLE `sessionSteps` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `sessionId` text NOT NULL,
    `stepType` text NOT NULL,
    `exerciseName` text,
    `orderIndex` integer NOT NULL,
    `sets` integer,
    `reps` integer,
    `durationSeconds` integer,
    FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);