import {Readable} from 'node:stream';
import {checkSignature,quoteFilePath} from './quote-security.mjs';
export function createDownloadHandler(loadBlob = ()=>import('@vercel/blob')) {
return async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');res.statusCode=405;return res.end('Método no permitido');}
 const url=new URL(req.url,'https://cotizador-demarca.vercel.app');
 const id=url.searchParams.get('id')||'';
 const expiry=Number(url.searchParams.get('exp'));
 const sig=url.searchParams.get('sig')||'';
 if(!process.env.QUOTE_LINK_SECRET || !checkSignature(id,expiry,sig,process.env.QUOTE_LINK_SECRET)){
   res.statusCode=403;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end('Enlace inválido o vencido. Solicita una nueva cotización.');
 }
 if(!process.env.BLOB_READ_WRITE_TOKEN){res.statusCode=503;return res.end('Servicio de documentos temporalmente no disponible.');}
 try{
   const {get}=await loadBlob();
   const result=await get(quoteFilePath(id),{access:'private'});
   if(!result || result.statusCode!==200 || !result.stream){res.statusCode=404;return res.end('Documento no disponible.');}
   res.statusCode=200;
   res.setHeader('Content-Type','application/pdf');
   res.setHeader('Content-Disposition','inline; filename="Cotizacion-Rey-Polanco.pdf"');
   return Readable.fromWeb(result.stream).pipe(res);
 }catch(error){console.error('Error al recuperar el PDF',error?.name||'Error');res.statusCode=502;return res.end('No se pudo recuperar el documento.');}
}
}
export default createDownloadHandler();
