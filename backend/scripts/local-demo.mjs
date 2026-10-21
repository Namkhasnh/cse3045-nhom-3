// Explicit local operator fixture. Never imported by the HTTP server or run on startup.
import 'dotenv/config';
import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import mariadb from 'mariadb';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { databaseConfig, provisionDatabaseUrl } from '../dist/prisma/database.config.js';
import { hashPassword } from '../dist/modules/accounts/password-hash.js';
import { AuditService } from '../dist/modules/audit/audit.service.js';
import { RequestStore } from '../dist/common/transactions/request-store.js';
import { OnboardingWorkflow } from '../dist/workflows/onboarding.workflow.js';
import { RestaurantSettingsWorkflow } from '../dist/workflows/restaurant-settings.workflow.js';
import { DeliveryWorkflow } from '../dist/workflows/delivery.workflow.js';
import { DishesWorkflow } from '../dist/workflows/dishes.workflow.js';
import { CommissionPolicyWorkflow } from '../dist/workflows/commission-policy.workflow.js';

const target = databaseConfig();
if (process.env.NODE_ENV === 'production' || process.env.LOCAL_DEMO_CONFIRM !== 'hlf_dev_flow' ||
    target.host !== '127.0.0.1' || target.port !== 3307 || target.database !== 'hlf_dev_flow') {
  throw new Error('Explicit LOCAL_DEMO_CONFIRM=hlf_dev_flow on loopback:3307/hlf_dev_flow required.');
}
const operatorUrl = provisionDatabaseUrl();
const operator = new PrismaService(operatorUrl);
const lock = await mariadb.createConnection(databaseConfig(operatorUrl));
let app;
try {
  const result = await lock.query("SELECT GET_LOCK('hlf.local-demo.vju-v1',0) AS acquired");
  if (String(result[0].acquired) !== '1') throw new Error('Another local fixture command is running');
  if (!/^9\.2\.0(?:[-.]|$)/.test((await lock.query('SELECT VERSION() AS v'))[0].v)) throw new Error('MySQL 9.2.0 required');
  await operator.$connect();
  const authority = await operator.adminAuthority.findUniqueOrThrow({ where: { id: 1 } });
  const factor = await operator.adminFactor.findUnique({ where: { accountId: authority.accountId } });
  if (!factor?.enrolledAt) throw new Error('Existing enrolled operator required; this command never creates Admins.');
  const admin = authority.accountId;
  const requests = new RequestStore(), audit = new AuditService();
  const manifest = { version: 'vju-local-v1', login: 'local_demo_vju', name: 'Bếp VJU (Mẫu)' };
  const passwordHash = await hashPassword(randomBytes(48).toString('base64url'));
  const bootstrap = await operator.$transaction(async db => {
    await db.$queryRaw`SELECT id FROM accounts WHERE id=${admin} FOR UPDATE`;
    const c = { db }, replay = await requests.get(c, admin, 'local-demo.bootstrap', manifest.version, manifest);
    if (replay) return replay;
    if (await db.account.findUnique({ where: { loginIdentifier: manifest.login } })) throw new Error('Fixture login already belongs to an unmarked account');
    const owner = await db.account.create({ data: { loginIdentifier: manifest.login, displayName: 'Chủ Bếp VJU (Mẫu)', passwordHash, role: 'student', email: 'local-demo-vju@example.test', emailVerifiedAt: new Date() } });
    await audit.record(c, { actorId: admin, action: 'account.created', targetType: 'account', targetId: owner.id, changes: { classification: 'local_demo', role: 'student' } });
    return requests.finish(c, admin, 'local-demo.bootstrap', manifest.version, { owner_id: owner.id.toString() });
  });
  const owner = BigInt(bootstrap.owner_id);
  const account = await operator.account.findUniqueOrThrow({ where: { id: owner } });
  if (account.loginIdentifier !== manifest.login || account.displayName !== 'Chủ Bếp VJU (Mẫu)' || account.email !== 'local-demo-vju@example.test') throw new Error('Fixture identity changed; inspect manually');
  app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const onboarding = app.get(OnboardingWorkflow), settings = app.get(RestaurantSettingsWorkflow);
  const delivery = app.get(DeliveryWorkflow), dishes = app.get(DishesWorkflow), commissions = app.get(CommissionPolicyWorkflow);
  const terms = await operator.partnershipTermsVersion.findFirstOrThrow({ orderBy: { effective_at: 'desc' } });
  let restaurant = await operator.restaurants.findUnique({ where: { owner_id: owner } });
  if (!restaurant) {
    let application = await operator.restaurantApplication.findFirst({ where: { applicant_id: owner }, orderBy: { id: 'desc' } });
    if (!application) {
      const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6hGQAAAAASUVORK5CYII=';
      const front = await onboarding.upload(owner, { kind: 'front_image', mime_type: 'image/png', content_base64: png });
      const business = await onboarding.upload(owner, { kind: 'business_document', mime_type: 'image/png', content_base64: png });
      await onboarding.submit(owner, { restaurant_name: manifest.name, address: 'Địa chỉ giả lập local — không phải điểm kinh doanh thật', contact_name: 'Chủ quán mẫu (giả lập)', contact_phone: '0900000000', front_image_id: front.id, business_document_id: business.id, terms_version: terms.version, terms_hash: terms.content_hash, consent: true }, 'local-demo-vju-application-v1');
      application = await operator.restaurantApplication.findFirstOrThrow({ where: { applicant_id: owner } });
    }
    await onboarding.review(admin, application.id.toString(), { expected_version: application.version, decision: 'approved' }, 'local-demo-vju-approval-v1');
    restaurant = await operator.restaurants.findUniqueOrThrow({ where: { owner_id: owner } });
  }
  if (restaurant.name !== manifest.name) throw new Error('Fixture restaurant changed; inspect manually');
  const id = restaurant.id.toString();
  const completed = await operator.setupRequest.findUnique({ where: { actor_id_operation_request_key: { actor_id: admin, operation: 'local-demo.completed', request_key: manifest.version } } });
  if (completed?.result) { console.log('Local sample already complete; no data changed. Restaurant '+id); }
  else {
    let view = await settings.read(owner, id);
    if (!view.hours.length) await settings.patch(owner, id, { expected_version: view.version, hours: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, opens_at: '06:00:00', closes_at: '23:00:00', closes_next_day: false })) });
    const category = await dishes.category(admin, { name: 'Món ăn (Mẫu local)' }, 'local-demo-vju-category-v1');
    const menu = [['Cơm gà','35000'],['Cơm sườn','40000'],['Bún thịt nướng','35000'],['Bánh mì trứng','20000']];
    for (const [index, [name, price]] of menu.entries()) await dishes.save(owner, id, { name, description: 'Dữ liệu mẫu local, không phải món đang bán thật.', price_vnd: price, category_id: category.data.id, image_reference: null, is_visible: true, is_available: true }, 'local-demo-vju-dish-v1-'+index);
    const point = await delivery.point(admin, { name: 'Điểm VJU (Mẫu local — chưa khảo sát thực tế)', latitude: '21.000000', longitude: '105.000000', is_active: true }, 'local-demo-vju-point-v1');
    const survey = await delivery.propose(owner, id, { expected_version: 0, pickup_rates: [{ pickup_point_id: point.data.id, distance_m: 500, delivery_fee_vnd: '5000', is_enabled: true }] }, 'local-demo-vju-survey-v1');
    await delivery.review(admin, survey.id, { expected_version: 1, decision: 'approved', note: 'GIẢ LẬP LOCAL: khoảng cách/phí minh họa, không phải khảo sát hoặc phê duyệt đối tác thật.' }, 'local-demo-vju-survey-review-v1');
    const proposal = await commissions.propose(admin, id, { expected_version: 0, rate: '0.03000000', terms_version: terms.version, terms_hash: terms.content_hash }, 'local-demo-vju-commission-v1');
    await commissions.confirm(owner, id, { proposal_id: proposal.id, expected_version: 1, agreement_hash: proposal.agreement_hash, consent: true }, 'local-demo-vju-consent-v1');
    view = await settings.read(admin, id, true);
    if (!view.is_active) await settings.patch(admin, id, { expected_version: view.version, is_active: true }, true);
    view = await settings.read(owner, id);
    if (!view.is_accepting_orders) await settings.patch(owner, id, { expected_version: view.version, is_accepting_orders: true });
    view = await settings.read(owner, id);
    if (view.readiness !== 'ready' || Object.values(view.checklist).some(value => !value)) throw new Error('Sample checklist incomplete');
    await operator.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM accounts WHERE id=${admin} FOR UPDATE`;
      const c = { db };
      await requests.get(c, admin, 'local-demo.completed', manifest.version, manifest);
      await requests.finish(c, admin, 'local-demo.completed', manifest.version, { restaurant_id: id, synthetic: true });
    });
    console.log('Created local sample: restaurant '+id+', four dishes, complete synthetic checklist. Checkout remains disabled.');
  }
} finally {
  await app?.close(); await operator.$disconnect();
  await lock.query("SELECT RELEASE_LOCK('hlf.local-demo.vju-v1')").catch(() => undefined);
  await lock.end();
}
