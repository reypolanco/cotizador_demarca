import test from 'node:test';
import assert from 'node:assert/strict';
import {Writable} from 'node:stream';
import {createHandler} from '../api/cotizacion.js';
import {createDownloadHandler} from '../api/descargar.js';
import {randomBytes} from 'node:crypto';
const KEY=randomBytes(48).toString('hex');
const database=new Map();
const storage={
 async put(path,contents,opts){assert.equal(opts.access,'private');database.set(path,Buffer.from(contents));},
 async get(path,opts){assert.equal(opts.access,'private');const content=database.get(path);return content?{statusCode:200,stream:new ReadableStream({start(c){c.enqueue(content);c.close()}})}:null;}
};
const create=createHandler(async()=>storage);
const download=createDownloadHandler(async()=>storage);

function response(){const chunks=[];const r=new Writable({write(chunk,enc,cb){chunks.push(Buffer.from(chunk));cb();}});r.headers={};r.statusCode=200;r.setHeader=(n,v)=>r.headers[n.toLowerCase()]=v;r.on('finish',()=>r.body=Buffer.concat(chunks));return r;}
function request(method,url,body){return {method,url,body,headers:{origin:'https://cotizador-demarca.vercel.app','content-length':'450'}};}
function completed(res){return new Promise(resolve=>res.once('finish',()=>resolve(res)));}
test('API crea enlace privado y sirve PDF con firma',async()=>{
 process.env.BLOB_READ_WRITE_TOKEN='test-token';process.env.QUOTE_LINK_SECRET=KEY;
 const input={packageId:'branding',addonIds:['logo-adicional'],includeItbis:false,clientName:'Ana',brandName:'Ejemplo',email:'',notes:''};
 const res=response();const created=completed(res);await create(request('POST','/api/cotizacion',input),res);await created;
 assert.equal(res.statusCode,201);
 const body=JSON.parse(res.body);assert.ok(body.url.includes('/api/descargar?'));assert.equal(body.url.includes('.private.blob.'),false);
 const fileReq=request('GET',new URL(body.url).pathname+new URL(body.url).search);
 const down=response();const done=completed(down);await download(fileReq,down);await done;
 assert.equal(down.statusCode,200);assert.equal(down.headers['content-type'],'application/pdf');
 assert.equal(down.headers['cache-control'],'private, no-store');
 assert.ok(Buffer.from(down.body).subarray(0,8).toString('latin1').startsWith('%PDF-1.4'));
 const expired=response();await download(request('GET','/api/descargar?id=abc&exp=1&sig=fake'),expired);
 assert.equal(expired.statusCode,403);
});
test('API exige variables privadas',async()=>{
 delete process.env.BLOB_READ_WRITE_TOKEN;
 const res=response();const done=completed(res);await create(request('POST','/api/cotizacion',{}),res);await done;
 assert.equal(res.statusCode,503);
});
