import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertRuntimeSchema,assertSchemaColumns,requiredRuntimeColumns,requiredRuntimeMigration} from './runtime-schema.js';
const columns=requiredRuntimeColumns.map(value=>{const [table_name,column_name]=value.split('.');return {table_name,column_name};});
test('Runtime schema gate permits complete schema and additive columns',()=>{
 assert.doesNotThrow(()=>assertSchemaColumns([...columns,{table_name:'restaurants',column_name:'future_optional'}]));
});
test('Runtime schema gate rejects missing columns before HTTP serves partially broken pages',()=>{
 assert.throws(()=>assertSchemaColumns(columns.filter(c=>c.column_name!=='cover_media_asset_id')),/restaurants\.cover_media_asset_id.*reviewed forward migrations/);
});
test('Runtime schema gate rejects a missing table without exposing credentials or running migrations',()=>{
 assert.throws(()=>assertSchemaColumns(columns.filter(c=>c.table_name!=='restaurant_cover_media')),/restaurant_cover_media\.id.*do not reset/);
});
test('Release gate catches the pre-order-code schema and mapped account columns',()=>{
 assert.ok(requiredRuntimeColumns.includes('orders.order_code'));
 assert.ok(requiredRuntimeColumns.includes('accounts.login_identifier'));
 assert.throws(()=>assertSchemaColumns(columns.filter(c=>c.table_name!=='orders'||c.column_name!=='order_code')),/orders\.order_code/);
});
test('Runtime checks completed release migration read-only even when every column exists',async()=>{
 let calls=0;
 const prisma={$queryRaw:async(...args:unknown[])=>{calls++;const sql=String(args[0]);assert.match(sql,/SELECT/);return sql.includes('information_schema')?columns:[];}} as unknown as Parameters<typeof assertRuntimeSchema>[0];
 await assert.rejects(assertRuntimeSchema(prisma),new RegExp(requiredRuntimeMigration));assert.equal(calls,2);
});
