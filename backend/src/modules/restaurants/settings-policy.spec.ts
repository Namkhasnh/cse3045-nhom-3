import {test} from 'node:test';import assert from 'node:assert/strict';
import {hoursInput,openAt,settingsInput,ready} from './settings-policy.js';
const h=(weekday:number,opens_at:string,closes_at:string,closes_next_day=false)=>({weekday,opens_at,closes_at,closes_next_day});
test('ELIG-01 weekly overnight boundaries and overlaps',()=>{
 const hours=hoursInput([h(7,'23:00:00','02:00:00',true)]);
 assert.equal(openAt(hours,new Date('2026-10-18T16:00:00Z')),true);assert.equal(openAt(hours,new Date('2026-10-18T19:00:00Z')),false);
 assert.throws(()=>hoursInput([...hours,h(1,'01:00:00','03:00:00')]));
 assert.doesNotThrow(()=>hoursInput([...hours,h(1,'02:00:00','03:00:00')]));
 for(const v of [[h(1,'12:00:00','12:00:00')],[h(1,'20:00:00','19:00:00')],[h(8,'00:00:00','01:00:00')],[h(1,'25:00:00','01:00:00')]])assert.throws(()=>hoursInput(v));
 assert.equal(openAt([],new Date()),false);
});
test('ONBOARD-03 no readiness/ownership/rate override or incomplete readiness',()=>{
 for(const key of ['readiness','owner_id','rate','is_active'])assert.throws(()=>settingsInput({expected_version:1,[key]:true}));
 assert.equal(ready({profile:true,hours:true,menu:false,delivery:false,commission:false}),false);
 assert.throws(()=>settingsInput({expected_version:1,latitude:'21.000000'}));
});
