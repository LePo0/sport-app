import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { weightEntries } from '../schema';
import { WeightEntry } from '../../types/profile';

function generateId(): string {
    return `weight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function getAllWeightEntries(): Promise<WeightEntry[]> {
    return db.select().from(weightEntries).orderBy(desc(weightEntries.date)).all();
}

export async function getLatestWeightEntry(): Promise<WeightEntry | null> {
    const result = await db.select().from(weightEntries).orderBy(desc(weightEntries.date)).get();
    return result || null;
}

export async function addWeightEntry(date: Date, weightKg: number): Promise<string> {
    const id = generateId();
    await db.insert(weightEntries).values({
        id,
        date: date.getTime(),
        weightKg,
    });
    return id;
}

export async function deleteWeightEntry(id: string): Promise<void> {
    await db.delete(weightEntries).where(eq(weightEntries.id, id));
}
