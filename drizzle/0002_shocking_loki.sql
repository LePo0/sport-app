ALTER TABLE
	`programSteps`
ADD
	`restAfterSetSeconds` integer DEFAULT 0 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	`programSteps`
ADD
	`restAfterExerciseSeconds` integer DEFAULT 0 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	`programs`
ADD
	`restBetweenRoundsSeconds` integer DEFAULT 0 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	`sessions`
ADD
	`rounds` integer DEFAULT 1 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	`sessions`
ADD
	`restBetweenRoundsSeconds` integer DEFAULT 0 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	`sessionSteps`
ADD
	`restAfterSetSeconds` integer;

--> statement-breakpoint
ALTER TABLE
	`sessionSteps`
ADD
	`restAfterExerciseSeconds` integer;

--> statement-breakpoint
DELETE FROM
	`programSteps`
WHERE
	`stepType` = 'rest';