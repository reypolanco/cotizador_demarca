/* Generador ligero de PDF A4. Sin dependencias y sin mostrar datos sensibles en URL. */
import {readFileSync} from 'node:fs';

const PAGE_W=595.28, PAGE_H=841.89;
const COLORS={navy:'#101A3A',blue:'#315DE2',pink:'#E90061',light:'#F1F5FF',ink:'#1D2640',muted:'#67748A',line:'#DDE4F0',white:'#FFFFFF'};
const enc=s=>Buffer.from(String(s).replace(/[\u2013\u2014]/g,'-').replace(/\u2019/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-').replace(/[\u2713\u2714]/g,'+'),'latin1').toString('latin1').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const rgb=hex=>{const n=hex.replace('#','');return [0,2,4].map(i=>(parseInt(n.slice(i,i+2),16)/255).toFixed(3)).join(' ')};
const estimate=(str,size,bold=false)=>[...String(str)].reduce((sum,ch)=>sum+(ch===' '?0.265:ch==='i'||ch==='l'?0.24:ch==='W'||ch==='M'?0.78:/[A-ZÁÉÍÓÚ]/.test(ch)?0.65:0.51)*size*(bold?1.03:1),0);
function wrap(str,maxW,size,bold){
  const words=String(str).replace(/\s+/g,' ').trim().split(' ');const result=[];let line='';
  for(const word of words){
    const next=line ? line+' '+word : word;
    if(estimate(next,size,bold)<=maxW){line=next;continue}
    if(line)result.push(line);
    line='';let w='';
    for(const char of word){if(estimate(w+char,size,bold)>maxW && w){result.push(w);w=''}w+=char}
    line=w;
  }
  if(line)result.push(line);
  return result.length?result:[''];
}
class PDF {
  constructor(){this.pages=[];this.y=0;this.addPage()}
  addPage(){this.page={cmd:[]};this.pages.push(this.page);this.y=0;}
  push(s){this.page.cmd.push(s)}
  rect(x,top,w,h,color){this.push(`${rgb(color)} rg ${x.toFixed(2)} ${(PAGE_H-top-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)}
  line(x,top,x2,top2,color=COLORS.line,width=0.8){this.push(`${rgb(color)} RG ${width} w ${x} ${(PAGE_H-top).toFixed(2)} m ${x2} ${(PAGE_H-top2).toFixed(2)} l S`)}
  text(str,x,top,size=10,font='F1',color=COLORS.ink){this.push(`${rgb(color)} rg BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${(PAGE_H-top-size).toFixed(2)} Tm (${enc(str)}) Tj ET`)}
  right(str,right,top,size=10,font='F1',color=COLORS.ink){this.text(str,right-estimate(str,size,font==='F2'),top,size,font,color)}
  lines(str,x,top,maxW,size=10,leading=15,font='F1',color=COLORS.ink){const lines=wrap(str,maxW,size,font==='F2');lines.forEach((s,i)=>this.text(s,x,top+leading*i,size,font,color));return lines.length*leading}
  image(x,top,w,h){this.push(`q ${w} 0 0 ${h} ${x} ${(PAGE_H-top-h).toFixed(2)} cm /Logo Do Q`)}
  ensure(height=36){if(this.y+height>777){this.addPage();this.header(true);return true}return false;}
  header(continuation=false){
    this.rect(0,0,PAGE_W,110,COLORS.navy);this.rect(0,106,PAGE_W,4,COLORS.pink);
    this.image(38,24,63,65);
    this.text('REY POLANCO',115,35,21,'F2',COLORS.white);
    this.text('ESTRATEGIA VISUAL  /  BRANDING',116,65,8.7,'F2','#BBCBF9');
    this.right('COTIZACIÓN ESTIMADA',PAGE_W-42,35,12,'F2',COLORS.white);
    this.right(continuation?'CONTINUACIÓN':'PROPUESTA PERSONALIZADA',PAGE_W-42,55,8.5,'F1','#BBCBF9');
    this.y=133;
  }
  section(name){this.ensure(39);this.rect(38,this.y,4,20,COLORS.blue);this.text(name.toUpperCase(),51,this.y+3,10.4,'F2',COLORS.navy);this.y+=33;}
  row(label,value,color=COLORS.ink){this.ensure(32);this.line(38,this.y+27,PAGE_W-38,this.y+27);this.lines(label,42,this.y+2,342,10.2,13,'F1',color);this.right(value,PAGE_W-42,this.y+2,10.5,'F2',COLORS.ink);this.y+=33;}
  paragraph(text){const segments=String(text||'').split(/\r?\n/);for(const chunk of segments){const lines=wrap(chunk, PAGE_W-86,10);for(const line of lines){this.ensure(17);this.text(line,43,this.y,10,'F1',COLORS.ink);this.y+=16}}}
}

function buildDocument({state,quote,included,id,issuedAt}){
 const pdf=new PDF();pdf.header();
 const date=new Intl.DateTimeFormat('es-DO',{timeZone:'America/Santo_Domingo',year:'numeric',month:'long',day:'numeric'}).format(issuedAt);
 pdf.text('DATOS DEL PROYECTO',42,pdf.y,9,'F2',COLORS.blue);pdf.y+=20;
 pdf.text('CLIENTE',42,pdf.y,8,'F2',COLORS.muted);pdf.text('MARCA / PROYECTO',303,pdf.y,8,'F2',COLORS.muted);pdf.y+=14;
 const clientH=pdf.lines(state.clientName||'Por definir',42,pdf.y,238,11,14,'F2');const brandH=pdf.lines(state.brandName||'Por definir',303,pdf.y,235,11,14,'F2');pdf.y+=Math.max(27,clientH+8,brandH+8);
 if(state.email){pdf.y+=pdf.lines('CORREO: '+state.email,42,pdf.y,PAGE_W-85,9.1,14,'F1',COLORS.ink)+3;}
 pdf.text('FECHA: '+date,42,pdf.y,9.1,'F1',COLORS.muted);pdf.right('REF: '+id.slice(0,8).toUpperCase(),PAGE_W-42,pdf.y,8.9,'F1',COLORS.muted);pdf.y+=25;
 pdf.section('Paquete seleccionado');pdf.row(quote.pkg.name.toUpperCase(),formatDOP(quote.pkg.price));
 pdf.y+=7;pdf.text('ESTE PAQUETE INCLUYE',42,pdf.y,8.3,'F2',COLORS.muted);pdf.y+=22;
 for(let i=0;i<included.length;i+=2){pdf.ensure(23);const a=included[i],b=included[i+1];pdf.rect(42,pdf.y+6,4,4,COLORS.pink);pdf.lines(a,52,pdf.y,205,9,12);if(b){pdf.rect(300,pdf.y+6,4,4,COLORS.pink);pdf.lines(b,310,pdf.y,225,9,12)}pdf.y+=23;}
 if(quote.addons.length){pdf.y+=12;pdf.section('Servicios adicionales');for(const add of quote.addons)pdf.row(add.name+(add.pricing==='percentage'?' (+25%)':''),formatDOP(add.price));}
 pdf.y+=15;pdf.ensure(165);
 pdf.rect(38,pdf.y,PAGE_W-76,122,COLORS.light);
 pdf.text('RESUMEN ECONÓMICO',52,pdf.y+14,9,'F2',COLORS.blue);
 pdf.text('Subtotal',52,pdf.y+38,10,'F1');pdf.right(formatDOP(quote.subtotal),PAGE_W-51,pdf.y+38,10.5,'F2');
 pdf.text('ITBIS (18%)',52,pdf.y+58,10,'F1');pdf.right(state.includeItbis?formatDOP(quote.itbis):'No incluido',PAGE_W-51,pdf.y+58,10.5,'F2');
 pdf.rect(38,pdf.y+82,PAGE_W-76,40,COLORS.navy);
 pdf.text('TOTAL ESTIMADO',52,pdf.y+92,11,'F2',COLORS.white);pdf.right(formatDOP(quote.total),PAGE_W-53,pdf.y+90,15,'F2',COLORS.white);pdf.y+=133;
 pdf.ensure(45);pdf.text('ANTICIPO (50%): '+formatDOP(quote.advance),42,pdf.y,10,'F2',COLORS.ink);pdf.right('BALANCE: '+formatDOP(quote.balance),PAGE_W-42,pdf.y,10,'F2',COLORS.ink);pdf.y+=30;
 if(state.notes){pdf.y+=10;pdf.section('Notas del cliente');pdf.paragraph(state.notes);}
 for(let i=0;i<pdf.pages.length;i++){
  const target=pdf.page;pdf.page=pdf.pages[i];
  pdf.line(38,797,PAGE_W-38,797,COLORS.line,0.8);
  pdf.text('Cotización preliminar sujeta a confirmación de alcance, tiempos e impuestos.',42,805,8,'F1',COLORS.muted);
  pdf.text('No incluye impresión ni producción física.  |  brandssfm@gmail.com',42,818,8,'F1',COLORS.muted);
  pdf.right(`${i+1} / ${pdf.pages.length}`,PAGE_W-42,807,8,'F1',COLORS.muted);
  pdf.page=target;
 }
 return pdf;
}
function formatDOP(amount){return 'RD$'+Math.round(amount).toLocaleString('en-US');}
function packPdf(doc,logoBuffer,width,height){
 const objects=[null];
 const add=(contents)=>{objects.push(Buffer.isBuffer(contents)?contents:Buffer.from(contents,'latin1'));return objects.length-1};
 const catalog=add(''),pagesId=add('');
 const normalId=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const boldId=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 const italicId=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
 const imgId=add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBuffer.length} >>\nstream\n`),logoBuffer,Buffer.from('\nendstream')]));
 const pageRefs=[];
 for (const page of doc.pages){
  const s=Buffer.from(page.cmd.join('\n')+'\n','latin1');
  const streamId=add(Buffer.concat([Buffer.from(`<< /Length ${s.length} >>\nstream\n`),s,Buffer.from('endstream')]));
  pageRefs.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${normalId} 0 R /F2 ${boldId} 0 R /F3 ${italicId} 0 R >> /XObject << /Logo ${imgId} 0 R >> >> /Contents ${streamId} 0 R >>`));
 }
 objects[catalog]=Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
 objects[pagesId]=Buffer.from(`<< /Type /Pages /Kids [${pageRefs.map(i=>i+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`);
 const pieces=[Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','latin1')];let offset=pieces[0].length;const offsets=[0];
 for(let i=1;i<objects.length;i++){
  offsets[i]=offset;const item=Buffer.concat([Buffer.from(`${i} 0 obj\n`),objects[i],Buffer.from('\nendobj\n')]);pieces.push(item);offset+=item.length;
 }
 const xrefStart=offset;let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objects.length;i++)xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
 xref+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
 pieces.push(Buffer.from(xref));return Buffer.concat(pieces);
}
export function generateQuotePdf({state,quote,included,id,issuedAt=new Date()}){
 const logo=readFileSync(new URL('./logo-pdf.jpg',import.meta.url));
 // La imagen JPEG es un activo local del proyecto.
 const {width,height}={width:253,height:280};
 return packPdf(buildDocument({state,quote,included,id,issuedAt}),logo,width,height);
}
