import { describe,expect,test } from 'bun:test';
import { adminPermissions,hasAdminPermission,permissionForAdminPath } from '../../lib/admin-auth';
import { isValidRecordDate,validateRecordInput } from '../../lib/input-validation';
import { compareClocks,resolveConflict } from '../../lib/sync-engine';
import { parseBillingEvent } from '../../lib/billing-events';
import { hashToken,signToken } from '../../lib/auth';
import { decodeJwt } from 'jose';
describe('Platform permission boundaries',()=>{
 test('support is read-only and cannot access payments',()=>{expect(hasAdminPermission({role:'support'},'organizations:read')).toBe(true);for(const permission of ['organizations:write','billing:read','billing:write','users:write','support:impersonate'])expect(hasAdminPermission({role:'support'},permission)).toBe(false);});
 test('billing cannot mutate accounts or plan definitions',()=>{expect(hasAdminPermission({role:'billing'},'billing:write')).toBe(true);expect(hasAdminPermission({role:'billing'},'users:write')).toBe(false);expect(hasAdminPermission({role:'billing'},'tiers:write')).toBe(false);});
 test('impersonation and unknown roles have no platform permissions',()=>{expect(adminPermissions({role:'super_admin',type:'impersonation'})).toEqual([]);expect(adminPermissions({role:'unknown'})).toEqual([]);});
 test('organization tier overrides require billing write',()=>expect(permissionForAdminPath('/api/admin/organizations/test/tier','PATCH')).toBe('billing:write'));
});
describe('Record input validation',()=>{
 test('rejects normalized invalid calendar dates',()=>{expect(isValidRecordDate('2026-02-31')).toBe(false);expect(isValidRecordDate('2024-02-29')).toBe(true);expect(isValidRecordDate('2026-02-28T12:00:00Z')).toBe(true);});
 test('checks both normal and offline record entity names',()=>{expect(validateRecordInput('/api/app/health',{goat_id:'another-farm'})).toBeTruthy();expect(validateRecordInput('/api/health_records',{record_date:'2026-02-31'})).toBeTruthy();});
 test('rejects negative measurements, infinity and unsafe photo schemes',()=>{expect(validateRecordInput('/api/app/weights',{weight_kg:-2})).toBeTruthy();expect(validateRecordInput('/api/app/milk',{morning_yield:'Infinity'})).toBeTruthy();expect(validateRecordInput('/api/app/goats',{image_url:'javascript:alert(1)'})).toBeTruthy();expect(validateRecordInput('/api/app/milk',{morning_yield:0,evening_yield:1.2})).toBeNull();});
});
describe('Synchronization conflict detection',()=>{
 test('identifies simultaneous device edits',()=>expect(compareClocks({phone:2,tablet:1},{phone:1,tablet:2})).toBe('concurrent'));
 test('uses causal order instead of a misleading wall clock',()=>{const local={id:'record',clock:{phone:1},updated_at:'2099-01-01',payload:{name:'old'},nodeId:'phone'};const remote={...local,clock:{phone:2},updated_at:'2026-01-01',payload:{name:'new'}};expect(resolveConflict(local,remote).winner).toBe(remote);});
});
describe('Billing and session contracts',()=>{
 test('accepts real webhook envelopes without a top-level event id',()=>expect(parseBillingEvent({event:'charge.success',data:{id:42,reference:'sample'}}).event).toBe('charge.success'));
 test('rejects malformed event data',()=>expect(()=>parseBillingEvent({event:'charge.success',data:null})).toThrow());
 test('support tokens expire in one hour and their storage digest is not a token',async()=>{const token=await signToken({sub:'test',role:'admin',type:'impersonation'});const payload=decodeJwt(token);expect(Number(payload.exp)-Number(payload.iat)).toBe(3600);expect(hashToken(token)).toHaveLength(64);expect(hashToken(token)).not.toContain('.');});
});
