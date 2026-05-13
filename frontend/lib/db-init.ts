import db, { initializeDatabase } from '../lib/db';

// Initialize database on server start
try {
  initializeDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

export default db;
