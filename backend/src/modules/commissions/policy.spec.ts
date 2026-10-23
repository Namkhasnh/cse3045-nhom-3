import {test} from 'node:test';import assert from 'node:assert/strict';import {Prisma} from '../../generated/prisma/client.js';
import {commercialRate,commissionAmount,specificAgreement} from './policy.js';import {parseMoney,checkedMoney,parseId} from '../../common/scalars/exact-scalars.js';
test('FIN-01 independent Decimal oracle and half-up once per completed subtotal',()=>{
 for(const subtotal of ['0','5','10','104','105','999','45000','999999999999','1000000000000'])for(const rate of ['0.03000000','0.03250000','0.05000000','0.10000000']){
 const oracle=new Prisma.Decimal(subtotal).mul(new Prisma.Decimal(rate)).toDecimalPlaces(0,Prisma.Decimal.ROUND_HALF_UP).toFixed(0);assert.equal(commissionAmount(subtotal,rate),oracle);}
 assert.equal(commissionAmount('104','0.10000000'),'10');assert.equal(commissionAmount('105','0.10000000'),'11');assert.equal(commissionAmount('10','0.10000000'),'1');
 assert.throws(()=>commissionAmount('1000000000001','0.05000000'));assert.throws(()=>commissionAmount('1','0.030000001'));
 assert.equal(parseId('9007199254740993'),9007199254740993n);assert.equal(checkedMoney(parseMoney('-321')),'-321');assert.throws(()=>checkedMoney(9223372036854775808n));
});
test('FIN-01 negotiated range has no default; agreement includes exact fractional percent',()=>{
 for(const r of ['0.03000000','0.03250000','0.05000000'])assert.equal(commercialRate(r),r);
 for(const r of [undefined,0.03,'0.03','0.030000001','0.02999999','0.05000001','0.10000000'])assert.throws(()=>commercialRate(r));
 assert.match(specificAgreement({version:'synthetic',content:'Approved synthetic terms'},'0.03250000'),/3,25%/);
});
