import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {validateQuoteInput,createSignature,checkSignature,LINK_VALIDITY_MS,quoteFilePath} from '../api/quote-security.mjs';
import {generateQuotePdf} from '../api/quote-pdf.mjs';

const secret=randomBytes(48).toString('base64url');
const id='a'.repeat(40);
const state={packageId:'branding',addonIds:['naming','logo-adicional'],includeItbis:true,clientName:'José Pérez',brandName:'Diseño Ñandú',email:'cliente@ejemplo.com',notes:'Logo para empresa. Incluye papelería y diseño digital.'};
test('firma criptográfica con expiración y enlace difícil de adivinar',()=>{
 const now=Date.now(),expiry=now+LINK_VALIDITY_MS;
 const sig=createSignature(id,expiry,secret);
 assert.equal(checkSignature(id,expiry,sig,secret,now),true);
 assert.equal(checkSignature(id,expiry,sig,secret,expiry+1),false);
 assert.equal(checkSignature(id,expiry,sig.slice(0,-1)+'0',secret,now),false);
 assert.equal(checkSignature('b'.repeat(40),expiry,sig,secret,now),false);
 assert.equal(checkSignature('../secrets',expiry,sig,secret,now),false);
 assert.equal(quoteFilePath(id),'cotizaciones/'+id+'.pdf');
});
test('la cotización se calcula en el servidor, no desde valores enviados por el navegador',()=>{
 const {quote,included}=validateQuoteInput({...state,total:1,subtotal:2});
 assert.equal(quote.subtotal,50000);assert.equal(quote.itbis,9000);assert.equal(quote.total,59000);
 assert.ok(included.includes('Estrategia de marca'));
});
test('validación de entradas maliciosas y límites',()=>{
 assert.throws(()=>validateQuoteInput({...state,packageId:'inexistente'}));
 assert.throws(()=>validateQuoteInput({...state,addonIds:['__proto__']}));
 assert.throws(()=>validateQuoteInput({...state,includeItbis:'true'}));
 assert.throws(()=>validateQuoteInput({...state,email:'invalido'}));
 const {state:clean}=validateQuoteInput({...state,notes:'X'.repeat(999)});
 assert.equal(clean.notes.length,700);
});
test('genera un archivo PDF real con el logo y los datos',()=>{
 const validated=validateQuoteInput(state);
 const pdf=generateQuotePdf({...validated,id,issuedAt:new Date('2026-10-16T02:00:00Z')});
 assert.ok(Buffer.isBuffer(pdf));assert.ok(pdf.length>5000);
 assert.equal(pdf.subarray(0,8).toString('latin1'),'%PDF-1.4');
 assert.ok(pdf.includes(Buffer.from('/DCTDecode')));
 assert.ok(pdf.includes(Buffer.from('59,000')));
});
