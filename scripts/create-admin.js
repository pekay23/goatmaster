import { query } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@goatmaster.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@2026';
  const username = 'Admin';
  const role = 'admin';
  const tier = 'premium';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.');
    process.exit(1);
  }

  const password_hash = await hashPassword(password);

  const result = await query(
    `INSERT INTO users (email, password_hash, username, role, tier)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       username = EXCLUDED.username,
       role = EXCLUDED.role,
       tier = EXCLUDED.tier
     RETURNING id, email, username, role, tier, created_at`,
    [email, password_hash, username, role, tier]
  );

  console.log('Admin user created/updated successfully:');
  console.log(JSON.stringify(result.rows[0], null, 2));
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});