import { InferSelectModel } from 'drizzle-orm';
import { profile, weightEntries } from '../db/schema';

export type Profile = InferSelectModel<typeof profile>;
export type WeightEntry = InferSelectModel<typeof weightEntries>;
