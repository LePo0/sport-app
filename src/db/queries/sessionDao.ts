import { asc, eq, sql } from 'drizzle-orm';
import { db, sqliteDatabase } from '../client';
import { programs, sessionSteps, sessions } from '../schema';
import { StepType } from '../../types/enums';
import { SessionStep } from '../../types/session';

export interface SessionStepInput {
    stepType: StepType;
    exerciseName: string | null;
    orderIndex: number;
    sets: number | null;
    reps: number | null;
    durationSeconds: number | null;
}

function generateId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createSession(
    programId: string,
    programName: string,
    date: Date,
    totalDurationSeconds: number,
    steps: SessionStepInput[]
): Promise<string> {
    const id = generateId();

    sqliteDatabase.execSync('BEGIN');
    try {
        await db.insert(sessions).values({
            id,
            programId,
            programName,
            date: date.getTime(),
            totalDurationSeconds,
        });

        if (steps.length > 0) {
            await db.insert(sessionSteps).values(
                steps.map((step) => ({
                    sessionId: id,
                    stepType: step.stepType,
                    exerciseName: step.exerciseName,
                    orderIndex: step.orderIndex,
                    sets: step.sets,
                    reps: step.reps,
                    durationSeconds: step.durationSeconds,
                }))
            );
        }

        sqliteDatabase.execSync('COMMIT');
    } catch (error) {
        sqliteDatabase.execSync('ROLLBACK');
        throw error;
    }

    return id;
}

export async function getSessionById(sessionId: string): Promise<{
    id: string;
    programId: string;
    programName: string;
    date: number;
    totalDurationSeconds: number;
} | null> {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    return result || null;
}

export async function getSessionSteps(sessionId: string): Promise<SessionStep[]> {
    const rows = await db
        .select()
        .from(sessionSteps)
        .where(eq(sessionSteps.sessionId, sessionId))
        .orderBy(asc(sessionSteps.orderIndex))
        .all();

    return rows as SessionStep[];
}

export async function getSessionDates(): Promise<string[]> {
    const dateExpr = sql<string>`strftime('%Y-%m-%d', ${sessions.date} / 1000, 'unixepoch', 'localtime')`;

    const rows = await db
        .select({ date: dateExpr })
        .from(sessions)
        .groupBy(dateExpr)
        .orderBy(dateExpr)
        .all();

    return rows.map((row) => row.date);
}

export interface SessionForDateItem {
    id: string;
    programId: string;
    programName: string;
    totalDurationSeconds: number;
}

export async function getSessionsForDate(date: string): Promise<SessionForDateItem[]> {
    const rows = await db
        .select({
            id: sessions.id,
            programId: sessions.programId,
            programName: sql<string>`coalesce(${sessions.programName}, ${programs.name}, 'Programme')`,
            totalDurationSeconds: sessions.totalDurationSeconds,
        })
        .from(sessions)
        .leftJoin(programs, eq(programs.id, sessions.programId))
        .where(sql`strftime('%Y-%m-%d', ${sessions.date} / 1000, 'unixepoch', 'localtime') = ${date}`)
        .orderBy(asc(sessions.date))
        .all();

    return rows;
}

export async function getSessionDetail(sessionId: string): Promise<{
    id: string;
    programId: string;
    programName: string;
    date: number;
    totalDurationSeconds: number;
} | null> {
    const row = await db
        .select({
            id: sessions.id,
            programId: sessions.programId,
            programName: sessions.programName,
            date: sessions.date,
            totalDurationSeconds: sessions.totalDurationSeconds,
        })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .get();

    return row ?? null;
}
