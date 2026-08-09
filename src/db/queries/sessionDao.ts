import { db } from '../client';
import { sessions } from '../schema';

function generateId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createSession(
    programId: string,
    date: Date,
    totalDurationSeconds: number
): Promise<string> {
    const id = generateId();
    await db.insert(sessions).values({
        id,
        programId,
        date: date.getTime(),
        totalDurationSeconds,
    });
    return id;
}
