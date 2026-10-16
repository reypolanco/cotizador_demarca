import {randomBytes} from 'node:crypto';
import {validateQuoteInput, LINK_VALIDITY_MS, MAX_BODY_BYTES, quoteFilePath, createSignature} from './quote-security.mjs';
import {generateQuotePdf} from './quote-pdf.mjs';

const json=(res,code,obj)=>{res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.end(JSON.stringify(obj));};
async function parseBody(req){
 if(req.body && typeof req.body==='object')return req.body;
 if(typeof req.body==='string')return JSON.parse(req.body);
 let size=0;const chunks=[];
 for await (const chunk of req){size+=chunk.length;if(size>MAX_BODY_BYTES)throw new RangeError('Petición demasiado grande');chunks.push(chunk);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createHandler(loadBlob = ()=>import('@vercel/blob')) {
return async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Método no permitido.'});}
 const site=process.env.PUBLIC_SITE_URL||'https://cotizador-demarca.vercel.app';
 const origin=req.headers?.origin;
 if(origin){
   try{if(new URL(origin).host!==new URL(site).host)return json(res,403,{error:'Solicitud no autorizada.'});}
   catch{return json(res,403,{error:'Solicitud no autorizada.'});}
 }
 if(!process.env.BLOB_READ_WRITE_TOKEN || !process.env.QUOTE_LINK_SECRET || Buffer.byteLength(process.env.QUOTE_LINK_SECRET,'utf8')<32){
   return json(res,503,{error:'El envío de PDF está pendiente de configurar en Vercel.'});
 }
 let data;
 try{
   if(Number(req.headers?.['content-length']||0)>MAX_BODY_BYTES)throw new RangeError('Petición demasiado grande');
   data=validateQuoteInput(await parseBody(req));
 }catch(error){return json(res,error instanceof RangeError?413:400,{error:error.message||'Verifica los datos de la cotización.'});}
 try{
   const id=randomBytes(20).toString('hex');
   const exp=Date.now()+LINK_VALIDITY_MS;
   const pdf=generateQuotePdf({...data,id,issuedAt:new Date()});
   const {put}=await loadBlob();
   await put(quoteFilePath(id),pdf,{access:'private',contentType:'application/pdf',addRandomSuffix:false,cacheControlMaxAge:60});
   const sig=createSignature(id,exp,process.env.QUOTE_LINK_SECRET);
   const link=new URL('/api/descargar',site);
   link.searchParams.set('id',id);link.searchParams.set('exp',String(exp));link.searchParams.set('sig',sig);
   return json(res,201,{url:link.toString(),expiresAt:new Date(exp).toISOString()});
 }catch(error){
   console.error('No se pudo guardar la cotización',error?.name||'Error');
   return json(res,502,{error:'No se pudo guardar el PDF. Inténtalo nuevamente.'});
 }
}
}
export default createHandler();
