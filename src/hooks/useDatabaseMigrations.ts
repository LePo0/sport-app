import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../db/client';
import migrations from '../../drizzle/migrations';

/**
 * Hook personnalisé pour exécuter les migrations Drizzle
 * Retourne l'état de migration : pending, success, ou error
 */
export function useDatabaseMigrations() {
  const { success, error } = useMigrations(db, migrations);

  return {
    isLoading: !success && !error,
    isSuccess: success,
    isError: !!error,
    error,
  };
}
