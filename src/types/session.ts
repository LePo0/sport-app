import { InferSelectModel } from 'drizzle-orm';
import { sessionSteps, sessions } from '../db/schema';

export type Session = InferSelectModel<typeof sessions>;
export type SessionStep = InferSelectModel<typeof sessionSteps>;