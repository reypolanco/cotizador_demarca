import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKAGES,BASE_INCLUDED,ADDON_GROUPS,computeQuote,formatDOP,buildQuoteText,BRAND} from '../quote-core.mjs';

test('paquetes con valores base conocidos',()=>{
  assert.equal(PACKAGES.find(p=>p.id==='identidad').price,10000);
  assert.equal(PACKAGES.find(p=>p.id==='branding').price,20000);
});
test('identidad sin ITBIS',()=>{
  const q=computeQuote({packageId:'identidad'});
  assert.deepEqual([q.subtotal,q.itbis,q.total,q.advance,q.balance],[10000,0,10000,5000,5000]);
});
test('branding con ITBIS al 18% y anticipo del 50%',()=>{
  const q=computeQuote({packageId:'branding',includeItbis:true});
  assert.deepEqual([q.subtotal,q.itbis,q.total,q.advance,q.balance],[20000,3600,23600,11800,11800]);
});
test('añadir extra con precio y deduplicar ids',()=>{
  const extra=ADDON_GROUPS[0].items[0];
  const q=computeQuote({packageId:'identidad',addonIds:[extra.id,extra.id],includeItbis:true});
  assert.equal(q.addons.length,1);
  assert.equal(q.subtotal,10000+extra.price);
  assert.equal(q.itbis,Math.round(q.subtotal*.18));
  assert.equal(q.advance+q.balance,q.total);
});
test('no se ofrecen categorías de producción',()=>{
  assert.ok(BASE_INCLUDED.includes('Diseño de papelería básica'));
  assert.ok(!BASE_INCLUDED.includes('Recursos gráficos básicos'));
  assert.ok(ADDON_GROUPS.every(g=>!['Impresos y Packaging','Digital y Espacios'].includes(g.title)));
});
test('formato de pesos dominicanos',()=>assert.equal(formatDOP(20000),'RD$20,000'));
test('WhatsApp y enlace de regreso definidos',()=>{
  assert.equal(BRAND.landing,'https://rey-polanco-vercel.vercel.app/');
  assert.ok(/^\d+$/.test(BRAND.whatsapp));
});
test('texto para enviar cotización no incluye producción',()=>{
  const s=buildQuoteText({clientName:'Ana',brandName:'Mi marca',packageId:'identidad'});
  assert.match(s,/Ana/);assert.match(s,/RD\$10,000/);assert.match(s,/no incluye impresión ni producción/i);
});
