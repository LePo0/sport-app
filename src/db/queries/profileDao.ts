import { eq } from 'drizzle-orm';
import { db } from '../client';
import { profile } from '../schema';
import { Profile } from '../../types/profile';

export async function getProfile(): Promise<Profile | null> {
    const result = await db.select().from(profile).where(eq(profile.id, 'singleton')).get();
    return result || null;
}

export async function upsertProfile(heightCm: number): Promise<void> {
    const existing = await getProfile();

    if (existing) {
        await db.update(profile).set({ heightCm }).where(eq(profile.id, 'singleton'));
        return;
    }

    await db.insert(profile).values({ id: 'singleton', heightCm });
}
