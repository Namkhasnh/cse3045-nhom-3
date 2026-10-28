import type {PrismaService} from './prisma.service.js';

type Column={table_name:string;column_name:string};
export const requiredRuntimeMigration='20261027010000_account_profile_identity';
export const requiredRuntimeColumns=['accounts.avatar_media_asset_id','accounts.pending_email','accounts.email_change_auth_version','account_avatar_media.id','accounts.login_identifier','restaurants.description','restaurants.cover_media_asset_id','restaurants.avatar_media_asset_id','restaurant_cover_media.id','orders.order_code','orders.discount_vnd','orders.voucher_snapshot','vouchers.id','voucher_redemptions.order_id','commission_entries.subsidy_order_id'];

// Read-only release cutover manifest uses physical table/column names. Advance
// the manifest and release marker with schema-dependent changes; the marker also
// covers non-column DDL (e.g. the owner analytics index).
export function assertSchemaColumns(columns:readonly Column[],required:readonly string[]=requiredRuntimeColumns){
 const available=new Set(columns.map(c=>c.table_name+'.'+c.column_name));
 const missing=required.filter(column=>!available.has(column));
 if(missing.length)throw new Error('Database schema is behind this backend: '+missing.join(', ')+'. Apply reviewed forward migrations using the operator workflow before starting; do not reset the database.');
}
export async function assertRuntimeSchema(prisma:Pick<PrismaService,'$queryRaw'>){
 const columns=await prisma.$queryRaw<Column[]>`SELECT TABLE_NAME AS table_name,COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()`;
 assertSchemaColumns(columns);
 const rows=await prisma.$queryRaw<{migration_name:string}[]>`SELECT migration_name FROM _prisma_migrations WHERE migration_name=${requiredRuntimeMigration} AND finished_at IS NOT NULL AND rolled_back_at IS NULL`;
 if(rows.length!==1)throw new Error('Required runtime migration '+requiredRuntimeMigration+' is not complete. Use the reviewed operator migration workflow; HTTP startup never migrates automatically.');
}
