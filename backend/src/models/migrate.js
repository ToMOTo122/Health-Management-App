const pool = require('../config/db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Starting conversation migration...');

    // Step 1: Create conversations table
    const [tables] = await conn.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversations'"
    );
    if (tables.length === 0) {
      await conn.query(`
        CREATE TABLE conversations (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id     INT UNSIGNED NOT NULL,
          title       VARCHAR(100) NOT NULL DEFAULT '新对话',
          created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_updated (user_id, updated_at),
          CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('Created conversations table.');
    } else {
      console.log('Conversations table already exists, skipping.');
    }

    // Step 2: Add conversation_id column if not exists
    const [cols] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_history' AND COLUMN_NAME = 'conversation_id'"
    );
    if (cols.length === 0) {
      await conn.query(
        'ALTER TABLE chat_history ADD COLUMN conversation_id INT UNSIGNED DEFAULT NULL AFTER user_id'
      );
      console.log('Added conversation_id column to chat_history.');
    } else {
      console.log('conversation_id column already exists, skipping.');
    }

    // Step 3: For each user with chat messages, create a default conversation
    const [orphanUsers] = await conn.query(
      `SELECT DISTINCT ch.user_id FROM chat_history ch
       WHERE ch.conversation_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.user_id = ch.user_id)`
    );
    for (const { user_id } of orphanUsers) {
      await conn.query(
        "INSERT INTO conversations (user_id, title) VALUES (?, '历史对话')",
        [user_id]
      );
    }
    if (orphanUsers.length > 0) {
      console.log(`Created default conversations for ${orphanUsers.length} user(s).`);
    }

    // Step 4: Link orphan messages to their user's default conversation
    await conn.query(
      `UPDATE chat_history ch
       JOIN conversations c ON c.user_id = ch.user_id
       SET ch.conversation_id = c.id
       WHERE ch.conversation_id IS NULL`
    );
    console.log('Linked existing messages to conversations.');

    // Step 5: Make conversation_id NOT NULL and add index + FK
    const [nullCols] = await conn.query(
      "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_history' AND COLUMN_NAME = 'conversation_id'"
    );
    if (nullCols.length > 0 && nullCols[0].IS_NULLABLE === 'YES') {
      await conn.query(
        'ALTER TABLE chat_history MODIFY conversation_id INT UNSIGNED NOT NULL'
      );
      console.log('Made conversation_id NOT NULL.');
    }

    // Add index if not exists
    const [indexes] = await conn.query(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_history' AND INDEX_NAME = 'idx_conv_time'"
    );
    if (indexes.length === 0) {
      await conn.query(
        'ALTER TABLE chat_history ADD INDEX idx_conv_time (conversation_id, created_at)'
      );
      console.log('Added idx_conv_time index.');
    }

    // Add FK if not exists
    const [fks] = await conn.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_history' AND CONSTRAINT_NAME = 'fk_chat_conv'"
    );
    if (fks.length === 0) {
      await conn.query(
        'ALTER TABLE chat_history ADD CONSTRAINT fk_chat_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE'
      );
      console.log('Added fk_chat_conv foreign key.');
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
