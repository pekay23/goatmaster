import { query } from './db';

export async function logAudit(params) {
  const {
    actorId,
    actorEmail,
    actorRole,
    action,
    resource,
    resourceId,
    organizationId,
    beforeState,
    afterState,
    ipAddress,
    userAgent,
  } = params;

  await query(
    `INSERT INTO audit_logs
       (actor_id, actor_email, actor_role, action, resource, resource_id, organization_id, before_state, after_state, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      actorId,
      actorEmail,
      actorRole,
      action,
      resource,
      resourceId,
      organizationId,
      JSON.stringify(beforeState ?? {}),
      JSON.stringify(afterState ?? {}),
      ipAddress,
      userAgent,
    ]
  );
}
