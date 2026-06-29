'use client';
import { useMemo } from 'react';
import { Shield, AlertTriangle, Copy, Clock, CheckCircle } from 'lucide-react';
import { useAppStore }   from '@/lib/store/appStore';
import { runHealthCheck, scoreColor, scoreLabel } from '@/lib/healthCheck';
import type { HealthIssue } from '@/lib/healthCheck';

const IMETA: Record<HealthIssue['type'],{icon:React.ReactNode;label:string;color:string}> = {
  duplicate: {icon:<Copy size={13}/>,          label:'Password duplikat', color:'var(--red)'},
  weak:      {icon:<AlertTriangle size={13}/>,  label:'Password lemah',   color:'var(--gold)'},
  no_password:{icon:<Shield size={13}/>,        label:'Tanpa password',   color:'var(--muted)'},
  old:       {icon:<Clock size={13}/>,          label:'Tidak diupdate',   color:'var(--muted)'},
};

export function HealthCheckPanel() {
  const vault  = useAppStore((s) => s.vault);
  const report = useMemo(()=>runHealthCheck(vault),[vault]);
  if (!vault.length) return <div className="health-empty"><Shield size={28}/><p>Belum ada entri</p></div>;
  const {score,totalScanned,duplicateGroups,weakCount,noPassCount,oldCount}=report;
  const col=scoreColor(score), lab=scoreLabel(score);
  return (
    <div className="health-panel">
      <div className="health-score">
        <div className="health-score__ring">
          <svg viewBox="0 0 44 44" className="health-score__svg">
            <circle cx="22" cy="22" r="18" className="health-score__track"/>
            <circle cx="22" cy="22" r="18" className="health-score__fill"
              style={{stroke:col,strokeDasharray:`${(score/100)*113} 113`}}/>
          </svg>
          <span className="health-score__num" style={{color:col}}>{score}</span>
        </div>
        <div className="health-score__meta">
          <span className="health-score__label" style={{color:col}}>{lab}</span>
          <span className="health-score__sub">{totalScanned} entri dipindai</span>
        </div>
      </div>
      {report.issues.length>0&&(
        <div className="health-summary">
          {duplicateGroups>0&&<div className="health-pill health-pill--red"><Copy size={11}/> {duplicateGroups} duplikat</div>}
          {weakCount>0&&<div className="health-pill health-pill--gold"><AlertTriangle size={11}/> {weakCount} lemah</div>}
          {noPassCount>0&&<div className="health-pill health-pill--muted"><Shield size={11}/> {noPassCount} kosong</div>}
          {oldCount>0&&<div className="health-pill health-pill--muted"><Clock size={11}/> {oldCount} tua</div>}
        </div>
      )}
      {report.issues.length===0&&<div className="health-perfect"><CheckCircle size={18} style={{color:'var(--teal)'}}/><span>Semua password aman!</span></div>}
      {report.issues.length>0&&(
        <div className="health-issues">
          {report.issues.slice(0,6).map((issue,i)=>{
            const m=IMETA[issue.type];
            return (
              <div key={i} className="health-issue">
                <span className="health-issue__icon" style={{color:m.color}}>{m.icon}</span>
                <div className="health-issue__info">
                  <span className="health-issue__name">{issue.entryName}</span>
                  <span className="health-issue__detail">{issue.detail??m.label}</span>
                </div>
                <span className="health-issue__type" style={{color:m.color}}>{m.label}</span>
              </div>
            );
          })}
          {report.issues.length>6&&<p className="health-more">+{report.issues.length-6} masalah lainnya</p>}
        </div>
      )}
    </div>
  );
}
