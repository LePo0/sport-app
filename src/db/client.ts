import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

/**
 * Initialisation du client SQLite avec Drizzle ORM
 * 
 * Ouvre la base de données "myfit.db" en local sur l'appareil,
 * active les contraintes de clés étrangères, et retourne une instance Drizzle
 * avec le schéma typé.
 */
const sqliteDatabase = openDatabaseSync('myfit.db');

// Activation des contraintes de clés étrangères
sqliteDatabase.execSync('PRAGMA foreign_keys = ON');

/**
 * Instance Drizzle configurée pour expo-sqlite
 * Utiliser `db` pour tous les accès à la base de données
 */
export const db = drizzle(sqliteDatabase, { schema });

export default db;
