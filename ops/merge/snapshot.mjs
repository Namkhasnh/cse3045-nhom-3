// Private operator snapshots. Callers encrypt exports; never print rows/credentials.
import {createHash} from 'node:crypto';
export const json=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x);
export function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';return JSON.stringify(v);}
export const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:canonical(v)).digest('hex');
export const quote=n=>{if(!/^[a-zA-Z0-9_]+$/.test(n))throw Error('INVALID_IDENTIFIER');return '`'+n+'`';};
export const key=(table,row)=>json(table.pk.map(k=>row[k]==null?null:String(row[k])));
export async function snapshot(query){
 const version=(await query('SELECT VERSION() v'))[0].v;
 if(!/^9\.2\.0(?:[-.]|$)/.test(version))throw Error('MYSQL_920_REQUIRED');
 const tables={};
 for(const {name}of await query("SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")){
  const columns=await query('SHOW FULL COLUMNS FROM '+quote(name));
  const indexes=await query('SHOW INDEX FROM '+quote(name));
  const pk=indexes.filter(x=>x.Key_name==='PRIMARY').sort((a,b)=>Number(a.Seq_in_index)-Number(b.Seq_in_index)).map(x=>x.Column_name);
  if(!pk.length)throw Error('TABLE_WITHOUT_PRIMARY_KEY:'+name);
  const unique={};for(const x of indexes.filter(x=>!Number(x.Non_unique))){(unique[x.Key_name]??=[])[Number(x.Seq_in_index)-1]=x.Column_name;}
  const fkRows=await query("SELECT CONSTRAINT_NAME constraint_name,COLUMN_NAME column_name,REFERENCED_TABLE_NAME target_table,REFERENCED_COLUMN_NAME target_column,ORDINAL_POSITION position FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY CONSTRAINT_NAME,ORDINAL_POSITION",[name]);
  const fks={};for(const x of fkRows){const f=fks[x.constraint_name]??={target:x.target_table,columns:[],references:[]};f.columns.push(x.column_name);f.references.push(x.target_column);}
  const ddl=(await query('SHOW CREATE TABLE '+quote(name)))[0]['Create Table'];
  const rows=JSON.parse(json(await query('SELECT * FROM '+quote(name))));
  for(const row of rows)for(const c of columns){const value=row[c.Field];if(value==null)continue;
   if(/^(datetime|timestamp)/.test(c.Type))row[c.Field]=new Date(String(value).replace(' ','T').replace(/(?<!Z)$/,'Z')).toISOString();
   if(c.Type==='json')row[c.Field]=canonical(typeof value==='string'?JSON.parse(value):value);
   if(/^(tinyint|smallint|mediumint|int)(?:\b|\()/.test(c.Type))row[c.Field]=Number(value);
   if(/^decimal\(\d+,(\d+)\)/.test(c.Type)){
    const scale=Number(c.Type.match(/^decimal\(\d+,(\d+)\)/)[1]),[whole,fraction='']=String(value).split('.');
    if(fraction.length>scale)throw Error('DECIMAL_SCALE_MISMATCH');
    row[c.Field]=whole+(scale?'.'+fraction.padEnd(scale,'0'):'');
   }
  }
  rows.sort((a,b)=>{const x=canonical(pk.map(k=>a[k])),y=canonical(pk.map(k=>b[k]));return x<y?-1:x>y?1:0;});
  tables[name]={pk,columns:columns.map(x=>({name:x.Field,type:x.Type,nullable:x.Null==='YES',generated:/\b(?:VIRTUAL|STORED) GENERATED\b/.test(x.Extra),auto:/auto_increment/.test(x.Extra)})),unique:Object.values(unique),fks:Object.values(fks),rows,schema_hash:hash(ddl.replace(/ AUTO_INCREMENT=\d+/g,'').replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g,''))};
 }
 return {format:'hlf-merge-snapshot-v1',version,tables};
}
export function fingerprint(s){return hash(Object.fromEntries(Object.entries(s.tables).map(([n,t])=>[n,{schema:t.schema_hash,rows:t.rows.map(hash).sort()}])));}
export function compatible(source,target){
 for(const [name,t]of Object.entries(source.tables)){
  const other=target.tables[name];if(!other)throw Error('TARGET_TABLE_MISSING:'+name);
  for(const c of t.columns){const found=other.columns.find(x=>x.name===c.name);if(!found||found.type!==c.type||found.generated!==c.generated)throw Error('SCHEMA_MISMATCH:'+name+':'+c.name);}
 }
 const rows=s=>s.tables._prisma_migrations.rows;
 for(const m of rows(source)){if(!m.finished_at||m.rolled_back_at||!rows(target).some(x=>x.migration_name===m.migration_name&&x.checksum===m.checksum&&x.finished_at&&!x.rolled_back_at))throw Error('MIGRATION_MISMATCH');}
}
