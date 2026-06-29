import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import type { VaultEntry, CustomCategory } from '@/lib/types';
interface ExportPdfOptions { vault:VaultEntry[]; customCats:CustomCategory[]; appVersion:string; }
const PW=595,PH=842,M=50,LH=15,CW=PW-M*2;
const CAT:Record<string,string>={sosmed:'Sosmed',email:'Email',bank:'Bank',game:'Game',crypto:'Crypto',kartu:'Kartu',wifi:'Wi-Fi',lainnya:'Lainnya',note:'Catatan'};
function cl(id:string,cc:CustomCategory[]){return cc.find(c=>c.id===id)?.label??CAT[id]??id;}
function fp(e:VaultEntry):[string,string,boolean][]{
  const p:[string,string,boolean][]=[];
  if(e.user)p.push(['Username',e.user,false]);if(e.emailAddr)p.push(['Email',e.emailAddr,false]);
  if(e.pass)p.push(['Password',e.pass,true]);if(e.url)p.push(['URL',e.url,false]);
  if(e.note)p.push(['Catatan',e.note.slice(0,200),false]);if(e.wifiSSID)p.push(['SSID',e.wifiSSID,false]);
  if(e.wifiPass)p.push(['WiFi Pass',e.wifiPass,true]);if(e.cardNo)p.push(['No. Kartu',e.cardNo,true]);
  if(e.cardHolder)p.push(['Pemegang',e.cardHolder,false]);if(e.cardExpiry)p.push(['Exp.',e.cardExpiry,false]);
  if(e.cardCVV)p.push(['CVV',e.cardCVV,true]);if(e.walletAddr)p.push(['Wallet',e.walletAddr,true]);
  if(e.network)p.push(['Network',e.network,false]);if(e.walletPw)p.push(['Wallet PW',e.walletPw,true]);
  if(e.seedPhrase?.length)p.push(['Seed',e.seedPhrase.join(' '),true]);
  return p;
}
export async function exportVaultPdf({vault,customCats,appVersion}:ExportPdfOptions):Promise<void>{
  const doc=await PDFDocument.create();
  const fB=await doc.embedFont(StandardFonts.HelveticaBold);
  const fR=await doc.embedFont(StandardFonts.Helvetica);
  const fM=await doc.embedFont(StandardFonts.Courier);
  const C={gold:rgb(.94,.65,0),dark:rgb(.07,.08,.1),text:rgb(.1,.1,.15),muted:rgb(.45,.45,.55),white:rgb(1,1,1),bg:rgb(.97,.97,.98),line:rgb(.88,.88,.92)};
  let pg=doc.addPage([PW,PH]),y=PH-M;
  const wm=(p:ReturnType<typeof doc.addPage>)=>p.drawText('VAULT NEXT — DOKUMEN SENSITIF',{x:80,y:PH/2-10,size:22,font:fB,color:rgb(.85,.85,.88),opacity:.1,rotate:degrees(45)});
  const ft=(p:ReturnType<typeof doc.addPage>,n:number,t:number)=>{
    p.drawLine({start:{x:M,y:32},end:{x:PW-M,y:32},thickness:.4,color:C.line});
    p.drawText(`Vault Next v${appVersion}  •  Hal ${n}/${t}  •  ${new Date().toLocaleDateString('id-ID')}`,{x:M,y:20,size:7.5,font:fR,color:C.muted});
  };
  const np=()=>{pg=doc.addPage([PW,PH]);y=PH-M;pg.drawRectangle({x:0,y:0,width:PW,height:PH,color:C.bg});};
  const en=(n:number)=>{if(y-n<50)np();};
  // Cover
  pg.drawRectangle({x:0,y:0,width:PW,height:PH,color:C.dark});
  pg.drawRectangle({x:0,y:PH-6,width:PW,height:6,color:C.gold});
  pg.drawText('Vault Next',{x:M,y:PH-100,size:40,font:fB,color:C.white});
  pg.drawText('Password Backup',{x:M,y:PH-130,size:16,font:fR,color:C.gold});
  const now=new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  pg.drawText(`Diekspor: ${now}`,{x:M,y:PH-200,size:11,font:fR,color:C.muted});
  pg.drawText(`Total entri: ${vault.length}`,{x:M,y:PH-216,size:11,font:fR,color:C.muted});
  pg.drawRectangle({x:M,y:PH-330,width:CW,height:72,color:rgb(.9,.2,.2),opacity:.12,borderColor:rgb(.9,.3,.3),borderWidth:1});
  pg.drawText('⚠  DOKUMEN SENSITIF',{x:M+12,y:PH-286,size:11,font:fB,color:rgb(.95,.4,.4)});
  pg.drawText('Simpan di tempat aman. Jangan bagikan kepada siapapun.',{x:M+12,y:PH-303,size:10,font:fR,color:C.muted});
  pg.drawText('Dokumen ini berisi password dalam format plaintext.',{x:M+12,y:PH-318,size:10,font:fR,color:C.muted});
  wm(pg);
  // Entries
  np();
  const gr=new Map<string,VaultEntry[]>();
  for(const e of vault){if(!gr.has(e.cat))gr.set(e.cat,[]);const grp=gr.get(e.cat);if(grp)grp.push(e);}
  for(const [cid,ents] of gr){
    en(30);
    pg.drawRectangle({x:M,y:y-22,width:CW,height:24,color:C.dark});
    pg.drawText(cl(cid,customCats).toUpperCase(),{x:M+10,y:y-14,size:9,font:fB,color:C.gold});
    y-=32;
    for(const e of ents){
      const pairs=fp(e);en(pairs.length*LH+28);
      pg.drawText(e.name+(e.fav?'  ★':''),{x:M,y,size:11,font:fB,color:C.text});
      y-=4;
      pg.drawLine({start:{x:M,y},end:{x:M+CW,y},thickness:.4,color:C.line});
      y-=LH;
      for(const [lb,val,mono] of pairs){
        en(LH);
        const dv=val.length>90?val.slice(0,90)+'…':val;
        pg.drawText(`${lb}:`,{x:M,y,size:8.5,font:fB,color:C.muted});
        pg.drawText(dv,{x:M+75,y,size:8.5,font:mono?fM:fR,color:C.text});
        y-=LH;
      }
      y-=8;
    }
    y-=4;
  }
  // Footer semua halaman
  const tot=doc.getPageCount();
  const pgs=doc.getPages();
  for(let i=1;i<tot;i++){wm(pgs[i]);ft(pgs[i],i,tot-1);}
  const bytes=await doc.save();
  const blob=new Blob([bytes as unknown as ArrayBuffer],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`vault-backup-${new Date().toISOString().slice(0,10)}.pdf`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
