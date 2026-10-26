import { queryAsOwner as query, runWithDbContext } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = 'Admin';
  const role = 'admin';
  const tier = 'pro';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.');
    process.exit(1);
  }

  const password_hash = await hashPassword(password);

  // Create or get admin organization
  const orgResult = await query(
    `INSERT INTO organizations (name, slug, tier)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET
       tier = EXCLUDED.tier
     RETURNING id`,
    [username, 'goatmaster-admin', 'pro']
  );
  const orgId = orgResult.rows[0].id;

  const result = await query(
    `INSERT INTO users (email, password_hash, username, role, tier, organization_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       username = EXCLUDED.username,
       role = EXCLUDED.role,
       tier = EXCLUDED.tier,
       organization_id = EXCLUDED.organization_id
     RETURNING id, email, username, role, tier, organization_id, created_at`,
    [email, password_hash, username, role, tier, orgId]
  );

  // Ensure admin is a member of the organization
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role, status)
     VALUES ($1, $2, 'admin', 'active')
     ON CONFLICT (organization_id, user_id) DO NOTHING`,
    [orgId, result.rows[0].id]
  );

  console.log('Admin user created/updated successfully:');
  console.log(JSON.stringify(result.rows[0], null, 2));
  process.exit(0);
}

runWithDbContext({ role: 'service' }, createAdmin).catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});
