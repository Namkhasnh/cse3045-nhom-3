// Disposable browser harness: real MySQL/auth/catalog; only outbound password-corpus and SMTP are replaced.
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApiHttp } from '../src/common/http/api-http.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordSafetyService } from '../src/modules/accounts/password-policy.js';
import { EmailVerificationService } from '../src/modules/accounts/email-verification.service.js';
import { hashPassword } from '../src/modules/accounts/password-hash.js';
import { base32, encryptSecret, fingerprint } from '../src/modules/accounts/mfa-crypto.js';
const target = new URL(process.env.TEST_DATABASE_URL!);
if (!['localhost','127.0.0.1'].includes(target.hostname) || !/^test_/.test(target.pathname.slice(1))) throw new Error('Disposable local test DB required');
if (process.env.TEST_RUNTIME_DATABASE_URL) {
 const runtime = new URL(process.env.TEST_RUNTIME_DATABASE_URL);
 if (runtime.hostname !== target.hostname || runtime.port !== target.port || runtime.pathname !== target.pathname || runtime.username === target.username) throw new Error('Separate runtime user on the same disposable DB required');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
Object.assign(process.env, { JWT_SIGNING_KEY:'11'.repeat(32), CSRF_HMAC_KEY:'22'.repeat(32), ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32),
  JWT_ISSUER:'browser-test', JWT_AUDIENCE:'browser-test', JWT_KEY_ID:'browser-key', PUBLIC_ORIGIN:'http://127.0.0.1:43127' });
const email = new EmailVerificationService();
const module = await Test.createTestingModule({imports:[AppModule]})
 .overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_RUNTIME_DATABASE_URL ?? process.env.TEST_DATABASE_URL))
 .overrideProvider(PasswordSafetyService).useValue({check:async()=>undefined})
 .overrideProvider(EmailVerificationService).useValue({assertConfigured:()=>undefined,code:()=> '123456',hash:email.hash.bind(email),matches:email.matches.bind(email),send:async()=>undefined}).compile();
const app = module.createNestApplication(); configureApiHttp(app);
const prisma = new PrismaService(process.env.TEST_DATABASE_URL); await prisma.$connect();
const passwordHash = await hashPassword('synthetic browser passphrase');
const expired = await prisma.account.upsert({where:{loginIdentifier:'browser_expired'},
 create:{loginIdentifier:'browser_expired',passwordHash,role:'student',displayName:'Email hết hạn',email:'browser_expired@example.com'},
 update:{emailVerifiedAt:null}});
await prisma.account.update({where:{id:expired.id},data:{emailCodeHash:email.hash(expired.id,'123456'),
 emailCodeExpiresAt:new Date(Date.now()-1000),emailCodeSentAt:new Date(Date.now()-61000),emailCodeAttempts:0}});
const manager = await prisma.account.upsert({where:{loginIdentifier:'browser_manager'},create:{loginIdentifier:'browser_manager',passwordHash,role:'student',displayName:'Quản lý kiểm thử'},update:{passwordHash}});
const restaurant = await prisma.restaurants.upsert({where:{owner_id:manager.id},create:{owner_id:manager.id,name:'Quán kiểm thử VJU',address:'Dữ liệu kiểm thử trong DB dùng một lần',contact_phone:'0900000000',updated_at:new Date(),readiness:'ready',is_accepting_orders:true},update:{readiness:'ready'}});
await prisma.restaurant_hours.deleteMany({where:{restaurant_id:restaurant.id}});
await prisma.restaurant_hours.createMany({data:Array.from({length:7},(_,i)=>({restaurant_id:restaurant.id,weekday:i+1,opens_at:'00:00:00',closes_at:'23:59:59',closes_next_day:false}))});
const category = await prisma.dish_categories.upsert({where:{name:'Kiểm thử'},create:{name:'Kiểm thử'},update:{}});
await prisma.dishes.deleteMany({where:{restaurant_id:restaurant.id}});
await prisma.dishes.createMany({data:[{name:'Cơm kiểm thử',price_vnd:30000n,is_available:true},{name:'Món hết kiểm thử',price_vnd:50000n,is_available:false}].map(d=>({...d,restaurant_id:restaurant.id,category_id:category.id,description:'Món kiểm thử',updated_at:new Date()}))});
const admin = await prisma.account.upsert({where:{loginIdentifier:'browser_operator'},create:{loginIdentifier:'browser_operator',passwordHash,role:'student',displayName:'Admin kiểm thử'},update:{passwordHash}});
const existing = await prisma.adminAuthority.findUnique({where:{id:1}});
if (existing && existing.accountId !== admin.id) throw new Error('Unexpected authority in browser test DB');
await prisma.adminAuthority.upsert({where:{id:1},create:{id:1,accountId:admin.id},update:{}});
const secret = base32(Buffer.alloc(20,9));
await prisma.adminFactor.upsert({where:{accountId:admin.id},create:{accountId:admin.id,encryptedSecret:encryptSecret(secret,admin.id),enrolledAt:new Date()},update:{encryptedSecret:encryptSecret(secret,admin.id),enrolledAt:new Date(),lastStep:-1n}});
await prisma.adminRecoveryCode.upsert({where:{hash:fingerprint('ab'.repeat(16))},create:{hash:fingerprint('ab'.repeat(16)),accountId:admin.id},update:{accountId:admin.id,consumedAt:null}});
await prisma.$disconnect();
await app.listen(43128,'127.0.0.1');
console.log(`Browser test backend ready; restaurant ${restaurant.id}`);
for(const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,()=>{void app.close().then(()=>process.exit(0));});
