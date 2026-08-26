// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';

// SQL inlined as string; Metro cannot bundle .sql files directly
const m0000 = `CREATE TABLE \`exercises\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`metricType\` text NOT NULL,
\t\`mediaPath\` text,
\t\`mediaType\` text
);
--> statement-breakpoint
CREATE TABLE \`profile\` (
\t\`id\` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
\t\`heightCm\` real
);
--> statement-breakpoint
CREATE TABLE \`programSteps\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`programId\` text NOT NULL,
\t\`stepType\` text NOT NULL,
\t\`exerciseId\` text,
\t\`orderIndex\` integer NOT NULL,
\t\`sets\` integer,
\t\`reps\` integer,
\t\`durationSeconds\` integer,
\tFOREIGN KEY (\`programId\`) REFERENCES \`programs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
\tFOREIGN KEY (\`exerciseId\`) REFERENCES \`exercises\`(\`id\`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE \`programs\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`rounds\` integer DEFAULT 1 NOT NULL,
\t\`createdAt\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`sessions\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`programId\` text NOT NULL,
\t\`date\` integer NOT NULL,
\t\`totalDurationSeconds\` integer NOT NULL,
\tFOREIGN KEY (\`programId\`) REFERENCES \`programs\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE \`weightEntries\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`date\` integer NOT NULL,
\t\`weightKg\` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`weightEntries_date_unique\` ON \`weightEntries\` (\`date\`);`;

const m0001 = `ALTER TABLE \`sessions\` ADD \`programName\` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE \`sessionSteps\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`sessionId\` text NOT NULL,
	\`stepType\` text NOT NULL,
	\`exerciseName\` text,
	\`orderIndex\` integer NOT NULL,
	\`sets\` integer,
	\`reps\` integer,
	\`durationSeconds\` integer,
	FOREIGN KEY (\`sessionId\`) REFERENCES \`sessions\`(\`id\`) ON UPDATE no action ON DELETE cascade
);`;

const m0002 = `ALTER TABLE \`programSteps\` ADD \`restAfterSetSeconds\` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE \`programSteps\` ADD \`restAfterExerciseSeconds\` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE \`programs\` ADD \`restBetweenRoundsSeconds\` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE \`sessions\` ADD \`rounds\` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE \`sessions\` ADD \`restBetweenRoundsSeconds\` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE \`sessionSteps\` ADD \`restAfterSetSeconds\` integer;
--> statement-breakpoint
ALTER TABLE \`sessionSteps\` ADD \`restAfterExerciseSeconds\` integer;
--> statement-breakpoint
DELETE FROM \`programSteps\` WHERE \`stepType\` = 'rest';`;

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002
	}
}
