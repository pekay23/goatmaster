import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { query,runWithDbContext } from '../lib/db';
import { processBillingEvent } from '../lib/billing-events';

// Provider fixtures only: this script never calls Paystack or creates a charge.
const orgId=randomUUID();
const prefix='verification-'+orgId;
await runWithDbContext({role:'service'},async()=>{
 try {
  await query("INSERT INTO organizations(id,name,slug,tier,is_demo) VALUES($1,'Sample billing verification',$2,'free',true)",[orgId,prefix]);
  const customer={email:'billing-verification@sample.goatmaster.invalid',customer_code:'CUS_'+orgId};
  const plan={plan_code:'PLN_'+orgId};
  const data={id:1,reference:prefix+'-initial',amount:1500,currency:'GHS',customer,plan,metadata:{organizationId:orgId,tier:'basic'}};
  await query("INSERT INTO payments(reference,email,amount,status,tier,organization_id) VALUES($1,$2,1500,'pending','basic',$3)",[data.reference,customer.email,orgId]);
  const initial={event:'charge.success',data};
  await processBillingEvent(initial);
  await processBillingEvent(initial);
  await processBillingEvent({event:'subscription.create',data:{customer,plan,subscription_code:'SUB_'+orgId,next_payment_date:'2027-01-01'}});
  await processBillingEvent({event:'charge.success',data:{...data,id:2,reference:prefix+'-renewal',metadata:{}}});
  const payments=await query("SELECT reference,status FROM payments WHERE organization_id=$1 ORDER BY reference",[orgId]);
  assert.equal(payments.rowCount,2);
  assert.ok(payments.rows.every((item:{status:unknown})=>item.status==='success'));
  const subscription=await query('SELECT organization_id FROM subscriptions WHERE subscription_code=$1',['SUB_'+orgId]);
  assert.equal(subscription.rows[0].organization_id,orgId);
  const events=await query("SELECT status FROM billing_events WHERE organization_id=$1",[orgId]);
  assert.equal(events.rowCount,3);
  assert.ok(events.rows.every((item:{status:unknown})=>item.status==='processed'));
  await assert.rejects(()=>processBillingEvent({event:'charge.success',data:{...data,id:3,reference:prefix+'-wrong-amount',amount:1,metadata:{}}}),/does not match/);
  const organization=await query('SELECT tier FROM organizations WHERE id=$1',[orgId]);
  assert.equal(organization.rows[0].tier,'basic');
  console.log('PASS checkout matching, duplicate delivery, subscription resolution, renewal, and amount rejection');
 } finally {
  await query("DELETE FROM billing_events WHERE organization_id=$1 OR payload #>> '{data,reference}' LIKE $2",[orgId,prefix+'%']);
  for(const table of ['subscriptions','subscription_history','payments'])await query('DELETE FROM '+table+' WHERE organization_id=$1',[orgId]);
  await query('DELETE FROM organizations WHERE id=$1',[orgId]);
 }
});
process.exit(0);
