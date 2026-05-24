import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize database
const dbPath = process.env.DATA_PATH || '/data/quickhost.db';
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      gitUrl TEXT NOT NULL,
      gitBranch TEXT DEFAULT 'main',
      subdomain TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'pending',
      containerName TEXT,
      containerPort INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      buildOutput TEXT,
      startedAt INTEGER,
      completedAt INTEGER,
      error TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT,
      message TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ssl_certificates (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL UNIQUE,
      domain TEXT NOT NULL UNIQUE,
      certPath TEXT NOT NULL,
      keyPath TEXT NOT NULL,
      expiresAt INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_subdomain ON projects(subdomain);
    CREATE INDEX IF NOT EXISTS idx_deployments_projectId ON deployments(projectId);
    CREATE INDEX IF NOT EXISTS idx_logs_projectId ON logs(projectId);
  `);
}

// Initialize on require
try {
  initializeDatabase();
} catch (error) {
  console.error('Failed to initialize database schema:', error);
}

export default db;
