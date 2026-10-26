'use client';
import Link from 'next/link';
import type { Organization } from './contracts';
import { formatDate } from './contracts';
export type Org = Organization;
export function OrgTable({ data, returnHref = '/admin/organizations' }: { data: Organization[]; returnHref?: string }) {
  return <div className="gm-admin-table-wrap"><table className="gm-admin-table"><caption className="sr-only">Organizations matching your filters</caption><thead><tr><th scope="col">Organization</th><th scope="col">Plan</th><th scope="col">Subscription</th><th scope="col">Members</th><th scope="col">Goats</th><th scope="col">Created</th></tr></thead><tbody>{data.map(org => <tr key={org.id}><td><Link className="gm-admin-record-link" href={'/admin/organizations/' + org.id + '?return=' + encodeURIComponent(returnHref)}>{org.name}{org.is_demo && <em className="gm-admin-sample-label">Sample farm</em>}<span>{org.slug}{org.custom_domain ? ' · ' + org.custom_domain : ''}</span></Link></td><td><span className="gm-admin-pill">{org.tier}</span></td><td>{org.subscription_status.replaceAll('_', ' ')}</td><td>{org.member_count}</td><td>{org.goat_count}</td><td>{formatDate(org.created_at)}</td></tr>)}</tbody></table></div>;
}
