import * as SQLite from 'expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { programs } from '../schema';

function generateId(): string {
    return `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createProgram(name: string, rounds: number): Promise<string> {
    const id = generateId();
    await db.insert(programs).values({ id, name, rounds, createdAt: Date.now() });
    return id;
}

export async function updateProgram(id: string, name: string, rounds: number): Promise<void> {
    await db.update(programs).set({ name, rounds }).where(eq(programs.id, id));
}

export async function getAllPrograms(): Promise<{ id: string; name: string; rounds: number; createdAt: number }[]> {
    return db.select().from(programs).all();
}

export async function getProgramById(id: string): Promise<{ id: string; name: string; rounds: number; createdAt: number } | null> {
    const result = await db.select().from(programs).where(eq(programs.id, id)).get();
    return result || null;
}

export function watchPrograms(
    callback: (programs: { id: string; name: string; rounds: number; createdAt: number }[]) => void
): () => void {
    getAllPrograms().then(callback).catch(console.error);

    const subscription = SQLite.addDatabaseChangeListener(({ tableName }: { tableName: string; databaseName: string; databaseFilePath: string; rowId: number }) => {
        if (tableName === 'programs') {
            getAllPrograms().then(callback).catch(console.error);
        }
    });

    return () => {
        subscription.remove();
    };
}

export async function deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
}
