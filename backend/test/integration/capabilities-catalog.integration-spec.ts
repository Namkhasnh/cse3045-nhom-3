import assert from 'node:assert/strict';
import { randomBytes, createHmac } from 'node:crypto';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { AccountsService } from '../../src/modules/accounts/accounts.service.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { AdminProvisionRepository } from '../../src/modules/accounts/admin-provision.repository.js';
import { MfaRepository } from '../../src/modules/accounts/mfa.repository.js';
import { Prisma } from '../../src/generated/prisma/client.js';
import { openSql } from '../../src/modules/catalog/catalog.repository.js';
import { SessionService } from '../../src/http/auth/session.service.js';
import { configureApiHttp } from '../../src/common/http/api-http.js';
import { hashPassword } from '../../src/modules/accounts/password-hash.js';
import { base32, fingerprint, totp } from '../../src/modules/accounts/mfa-crypto.js';

const target = new URL(process.env.TEST_DATABASE_URL!);
if (!['localhost','127.0.0.1'].includes(target.hostname) || !/^test_/.test(target.pathname.slice(1))) throw new Error('Disposable local DB required');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.TRUSTED_PROXY_IPS = '127.0.0.1';
Object.assign(process.env, { JWT_SIGNING_KEY: '11'.repeat(32), CSRF_HMAC_KEY: '22'.repeat(32), ADMIN_MFA_ENCRYPTION_KEY: '33'.repeat(32),
  JWT_ISSUER: 'integration-test', JWT_AUDIENCE: 'integration-test', JWT_KEY_ID: 'integration-key', PUBLIC_ORIGIN: 'https://test.example' });

test('AUTH-04 / ADMIN-01/02 / CAT-01: real MySQL capability cutover, MFA races and public catalog', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication(); configureApiHttp(app); await app.listen(0, '127.0.0.1');
  const prisma = app.get(PrismaService), accounts = app.get(AccountsService), sessions = app.get(SessionService), base = await app.getUrl();
  const repository = new AdminProvisionRepository(prisma, new AuditService()), mfa = app.get(MfaRepository);
  const createdIds: bigint[] = [];
  const nonce = crypto.randomUUID().slice(0,8), password = 'synthetic protected passphrase', passwordHash = await hashPassword(password);
  const ip = `2001:db8:${nonce.slice(0,4)}:${nonce.slice(4,8)}::1`;
  const json = { 'x-forwarded-for': ip, origin: 'https://test.example', 'content-type': 'application/json' };
  const read = async (path: string) => { const response = await fetch(`${base}/api/v1${path}`); assert.equal(response.status,200); return response.json() as Promise<{data: Record<string, unknown>[];page:{next_cursor:string|null}}> };
  try {
    const manager = await prisma.account.create({ data: { loginIdentifier: `manager_${nonce}`, passwordHash, role: 'restaurant_owner', displayName: 'Manager' } });
    const unassigned = await prisma.account.create({ data: { loginIdentifier: `unassigned_${nonce}`, passwordHash, role: 'restaurant_owner', displayName: 'Unassigned' } });
    const oldAdmin = await prisma.account.create({ data: { loginIdentifier: `oldadmin_${nonce}`, passwordHash, role: 'admin', displayName: 'Legacy Admin' } });
    const another = await prisma.account.create({ data: { loginIdentifier: `other_${nonce}`, passwordHash, role: 'student', displayName: 'Other' } });
    createdIds.push(manager.id,unassigned.id,oldAdmin.id,another.id);
    const category = await prisma.dish_categories.create({ data: { name: `Cơm ${nonce}` } });
    const restaurant = await prisma.restaurants.create({ data: { id: 9007199254740993n + BigInt(Date.now()), owner_id: manager.id, name: `Cơm ${nonce}`, address: 'Synthetic test address', contact_phone: '0900000000', updated_at: new Date(), readiness: 'ready', latitude:'21.000000', longitude:'105.000000' } });
    const unpublished = await prisma.restaurants.create({ data: { owner_id: another.id, name: `Hidden ${nonce}`, address: 'Synthetic', contact_phone: '0900000000', updated_at: new Date() } });
    assert.deepEqual((await accounts.present(manager)).capabilities.sort(), ['buy','manage_restaurant']);
    await assert.rejects(() => prisma.restaurants.create({ data: { owner_id: manager.id, name: 'Duplicate', address: 'Synthetic', contact_phone: '0900000000', updated_at: new Date() } }));
    const ownershipRace = await Promise.allSettled(['A','B'].map(suffix => prisma.restaurants.create({ data: {
      owner_id: unassigned.id, name: `Synthetic ownership race ${suffix}`, address: 'Synthetic',
      contact_phone: '0900000000', updated_at: new Date(), is_active: false,
    } })));
    assert.equal(ownershipRace.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(await prisma.restaurants.count({ where: { owner_id: unassigned.id } }), 1);
    const soldout = await prisma.dishes.create({ data: { restaurant_id: restaurant.id, category_id: category.id, name: `Cơm A ${nonce}`, description: 'Synthetic sold-out dish', price_vnd: 30000n, is_available: false, updated_at: new Date() } });
    await prisma.dishes.create({ data: { restaurant_id: restaurant.id, category_id: category.id, name: `Cơm B ${nonce}`, description: 'Synthetic dish', price_vnd: 50000n, updated_at: new Date() } });
    const hidden = await prisma.dishes.create({ data: { restaurant_id: restaurant.id, category_id: category.id, name: `Cơm C ${nonce}`, description: 'Hidden', price_vnd: 1n, is_visible: false, updated_at: new Date() } });
    const found = await read(`/restaurants?q=${encodeURIComponent('com')}&category_id=${category.id}&min_price_vnd=30000&max_price_vnd=30000`);
    assert.equal(found.data[0].id, restaurant.id.toString()); assert.equal(found.data[0].min_price_vnd,'30000'); assert.equal(found.data[0].latitude,'21.000000');
    for (const privateKey of ['owner_id','commission_rate','password_hash','email']) assert.equal(privateKey in found.data[0],false);
    assert.equal((await fetch(`${base}/api/v1/restaurants/${unpublished.id}`)).status,404);
    await prisma.restaurant_hours.create({data:{restaurant_id:restaurant.id,weekday:1,opens_at:'22:00:00',closes_at:'02:00:00',closes_next_day:true}});
    for (const [instant, expected] of [['2026-10-19T16:00:00Z',true],['2026-10-19T18:00:00Z',true],['2026-10-19T19:00:00Z',false]] as const) {
      const result = await prisma.$queryRaw<Array<{is_open:bigint}>>(Prisma.sql`SELECT ${openSql(new Date(instant))} AS is_open FROM restaurants r WHERE r.id=${restaurant.id}`);
      assert.equal(Boolean(result[0].is_open),expected);
    }
    assert.equal((await fetch(`${base}/api/v1/dishes/${hidden.id}`)).status,404);
    const first = await read(`/dishes?restaurant_id=${restaurant.id}&limit=1&sort=price_vnd`);
    assert.equal(first.data[0].id, soldout.id.toString()); assert.equal(first.data[0].is_available,false);
    assert.ok(first.page.next_cursor);
    const second = await read(`/dishes?restaurant_id=${restaurant.id}&limit=1&sort=price_vnd&cursor=${encodeURIComponent(first.page.next_cursor)}`);
    assert.equal(second.data[0].price_vnd,'50000');
    assert.equal((await read(`/dishes?restaurant_id=${restaurant.id}&is_available=true`)).data.length,1);
    assert.equal((await fetch(`${base}/api/v1/dishes?restaurant_id=${restaurant.id}&limit=1&sort=-price_vnd&cursor=${encodeURIComponent(first.page.next_cursor)}`)).status,422);
    const step = BigInt(Math.floor(Date.now()/30000)), secret = base32(Buffer.alloc(20, 7));
    const input = { username: `operator_${nonce}`, displayName: 'Synthetic Operator', passwordHash, requestId: `initialize_${nonce}`,
      secret, step: step - 1n, recoveryCodes: Array.from({length:10},()=>randomBytes(16).toString('hex')), recover: false,
      legacyAdminIds: [oldAdmin.id], legacyOwnerIds: [manager.id,unassigned.id] };
    const raced = await Promise.allSettled([repository.apply(input), repository.apply({ ...input, username: `second_${nonce}` })]);
    assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);
    const authority = await prisma.adminAuthority.findUniqueOrThrow({where:{id:1}});
    createdIds.push(authority.accountId);
    const admin = await prisma.account.findUniqueOrThrow({where:{id:authority.accountId}});
    assert.equal(await prisma.adminAuthority.count(),1);
    assert.equal((await prisma.account.findUniqueOrThrow({where:{id:oldAdmin.id}})).role,'student');
    assert.equal((await prisma.restaurants.findUniqueOrThrow({where:{id:restaurant.id}})).owner_id,manager.id);
    assert.ok((await accounts.present(await prisma.account.findUniqueOrThrow({where:{id:manager.id}}))).capabilities.includes('buy'));
    await assert.rejects(()=>prisma.$executeRaw`INSERT INTO admin_authority(id,account_id) VALUES(2,${oldAdmin.id})`);
    await assert.rejects(()=>sessions.verify(sessions.issue(admin).jwt));
    const login = await fetch(`${base}/api/v1/auth/login`,{method:'POST',headers:json,body:JSON.stringify({login_identifier:admin.loginIdentifier,password})});
    assert.equal(login.status,200); assert.equal(login.headers.getSetCookie().length,0);
    const challenge = (await login.json() as {data:{challenge_id:string}}).data;
    const secondChallenge = await mfa.challenge(admin,ip); assert.ok(secondChallenge);
    const proof = totp(secret,step);
    const verifications = await Promise.all([mfa.verify(challenge.challenge_id,{code:proof},ip),mfa.verify(secondChallenge.challenge_id,{code:proof},ip)]);
    assert.equal(verifications.filter(Boolean).length,1);
    const session = sessions.issue(admin,true); assert.equal((await sessions.verify(session.jwt)).account.id,admin.id);
    const exhausted = await mfa.challenge(admin,ip); assert.ok(exhausted);
    for(let i=0;i<5;i++) assert.equal(await mfa.verify(exhausted.challenge_id,{code:'not-six-digits'},ip),null);
    assert.equal((await prisma.adminChallenge.findUniqueOrThrow({where:{id:fingerprint(exhausted.challenge_id)}})).attempts,5);
    const expired = await mfa.challenge(admin,ip); assert.ok(expired);
    await prisma.adminChallenge.update({where:{id:fingerprint(expired.challenge_id)},data:{expiresAt:new Date(0)}});
    assert.equal(await mfa.verify(expired.challenge_id,{code:proof},ip),null);
    const c1 = await mfa.challenge(admin,ip), c2 = await mfa.challenge(admin,ip);assert.ok(c1&&c2);
    const recoveries = await Promise.all([mfa.verify(c1.challenge_id,{recovery_code:input.recoveryCodes[0]},ip),mfa.verify(c2.challenge_id,{recovery_code:input.recoveryCodes[0]},ip)]);
    assert.equal(recoveries.filter(r=>r?.recovery).length,1);
    await assert.rejects(()=>sessions.verify(session.jwt));
    assert.equal((await prisma.adminFactor.findUniqueOrThrow({where:{accountId:admin.id}})).enrolledAt,null);
    assert.equal((await prisma.adminAuthority.findUniqueOrThrow({where:{id:1}})).accountId,admin.id);
    await repository.apply({...input, username:admin.loginIdentifier,recover:true,step,recoveryCodes:Array.from({length:10},()=>randomBytes(16).toString('hex')), requestId:`recover_${nonce}`});
    assert.equal(await prisma.adminAuthority.count(),1);
    await assert.rejects(()=>repository.apply({...input, username:admin.loginIdentifier,recover:true,requestId:`recover_${nonce}`}));
    const beforeFactor = await prisma.adminFactor.findUniqueOrThrow({where:{accountId:admin.id}});
    const beforeAccount = await prisma.account.findUniqueOrThrow({where:{id:admin.id}});
    const failingAudit = new AdminProvisionRepository(prisma, {record:async()=>{throw new Error('Synthetic audit failure');}} as never);
    await assert.rejects(()=>failingAudit.apply({...input, username:admin.loginIdentifier,recover:true,requestId:`rollback_${nonce}`,recoveryCodes:Array.from({length:10},()=>randomBytes(16).toString('hex'))}));
    assert.equal((await prisma.adminFactor.findUniqueOrThrow({where:{accountId:admin.id}})).encryptedSecret,beforeFactor.encryptedSecret);
    assert.equal((await prisma.account.findUniqueOrThrow({where:{id:admin.id}})).authVersion,beforeAccount.authVersion);
    assert.equal(await prisma.adminOperatorRequest.count({where:{requestId:`rollback_${nonce}`}}),0);
    const quotaHash = createHmac('sha256',Buffer.from(process.env.CSRF_HMAC_KEY!,'hex')).update(`mfa_account:${admin.id}`).digest('hex');
    await prisma.adminMfaLimit.update({where:{scope_subjectHash:{scope:'mfa_account',subjectHash:quotaHash}},data:{attemptCount:20}});
    const currentAdmin = await prisma.account.findUniqueOrThrow({where:{id:admin.id}});
    assert.equal(await mfa.challenge(currentAdmin,ip),null);
    await assert.rejects(()=>prisma.adminMfaLimit.update({where:{scope_subjectHash:{scope:'mfa_account',subjectHash:quotaHash}},data:{attemptCount:21}}));
    await prisma.adminMfaLimit.update({where:{scope_subjectHash:{scope:'mfa_account',subjectHash:quotaHash}},data:{windowStart:new Date(Date.now()-901000)}});
    assert.ok(await mfa.challenge(currentAdmin,ip));

  } finally {
    if (createdIds.length) {
      await prisma.adminOperatorRequest.deleteMany({where:{accountId:{in:createdIds}}});
      await prisma.adminAuthority.deleteMany({where:{accountId:{in:createdIds}}});
      await prisma.adminChallenge.deleteMany({where:{accountId:{in:createdIds}}});
      await prisma.adminRecoveryCode.deleteMany({where:{accountId:{in:createdIds}}});
      await prisma.adminFactor.deleteMany({where:{accountId:{in:createdIds}}});
      const owned = await prisma.restaurants.findMany({where:{owner_id:{in:createdIds}},select:{id:true}});
      await prisma.dishes.deleteMany({where:{restaurant_id:{in:owned.map(r=>r.id)}}});
      await prisma.restaurant_hours.deleteMany({where:{restaurant_id:{in:owned.map(r=>r.id)}}});
      await prisma.restaurants.deleteMany({where:{owner_id:{in:createdIds}}});
      await prisma.auditLog.deleteMany({where:{actorId:{in:createdIds}}});
      await prisma.account.deleteMany({where:{id:{in:createdIds}}});
    }
    await app.close();
  }
});
