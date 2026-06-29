import type { VaultEntry } from '@/lib/types';

export interface HealthIssue {
  entryId: string; entryName: string;
  type: 'duplicate' | 'weak' | 'no_password' | 'old'; detail?: string;
}
export interface HealthReport {
  issues: HealthIssue[]; score: number; totalScanned: number;
  duplicateGroups: number; weakCount: number; noPassCount: number; oldCount: number;
}
const COMMON = new Set(['12345678','password','password1','qwerty123','admin123','iloveyou','abc123456']);

export function runHealthCheck(vault: VaultEntry[]): HealthReport {
  const issues: HealthIssue[] = [];
  const now = Date.now();
  const scan = vault.filter(e => !e.cat.startsWith('note'));
  // Duplikat
  const pm = new Map<string,string[]>();
  for (const e of scan) { if (!e.pass || e.pass.length < 3) continue; const k=e.pass.toLowerCase().trim(); if(!pm.has(k))pm.set(k,[]); const arr=pm.get(k);if(arr)arr.push(e.id); }
  let dg=0;
  for (const [,ids] of pm) { if(ids.length<2)continue; dg++; for(const id of ids){ const e=vault.find(x=>x.id===id); if(e)issues.push({entryId:id,entryName:e.name,type:'duplicate',detail:`Sama dengan ${ids.length-1} entri lain`}); } }
  // Lemah
  let wk=0;
  for (const e of scan) { if(!e.pass)continue; const p=e.pass; if(p.length<8||COMMON.has(p.toLowerCase())||/^(.)\1+$/.test(p)||/^[0-9]+$/.test(p)){wk++;issues.push({entryId:e.id,entryName:e.name,type:'weak',detail:p.length<8?`Hanya ${p.length} karakter`:'Password terlalu umum'});} }
  // Tanpa password
  let np=0;
  for (const e of scan) { if(!e.pass&&!e.wifiPass&&!e.cardNo){np++;issues.push({entryId:e.id,entryName:e.name,type:'no_password'});} }
  // Tua
  let old_=0;
  for (const e of scan) { if(e.ts&&now-e.ts>365*24*60*60*1000){old_++;const m=Math.floor((now-e.ts)/(30*24*60*60*1000));issues.push({entryId:e.id,entryName:e.name,type:'old',detail:`Belum diupdate ${m} bulan`});} }
  const affected=new Set(issues.map(i=>i.entryId)).size;
  const score=scan.length===0?100:Math.max(0,Math.round((1-affected/scan.length)*100));
  return {issues,score,totalScanned:scan.length,duplicateGroups:dg,weakCount:wk,noPassCount:np,oldCount:old_};
}
export const scoreColor=(s:number)=>s>=80?'var(--teal)':s>=50?'var(--gold)':'var(--red)';
export const scoreLabel=(s:number)=>s===100?'Sempurna':s>=80?'Baik':s>=50?'Perlu Perhatian':'Berisiko';
