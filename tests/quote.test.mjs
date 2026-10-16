import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKAGES,BASE_INCLUDED,ADDON_GROUPS,computeQuote,formatDOP,buildQuoteText,BRAND} from '../quote-core.mjs';

test('paquetes con valores base conocidos',()=>{
  assert.equal(PACKAGES.find(p=>p.id==='identidad').price,10000);
  assert.equal(PACKAGES.find(p=>p.id==='branding').price,30000);
});
test('identidad sin ITBIS',()=>{
  const q=computeQuote({packageId:'identidad'});
  assert.deepEqual([q.subtotal,q.itbis,q.total,q.advance,q.balance],[10000,0,10000,5000,5000]);
});
test('branding con ITBIS al 18% y anticipo del 50%',()=>{
  const q=computeQuote({packageId:'branding',includeItbis:true});
  assert.deepEqual([q.subtotal,q.itbis,q.total,q.advance,q.balance],[30000,5400,35400,17700,17700]);
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
  assert.ok(!BASE_INCLUDED.includes('Estrategia de marca'));
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


test('branding completo incluye estrategia y análisis, naming en 10 mil y logo adicional en 25%',()=>{
  const branding = PACKAGES.find(p=>p.id==='branding');
  assert.equal(branding.price,30000);
  const naming = ADDON_GROUPS[0].items.find(item=>item.id==='naming');
  const extraLogo = ADDON_GROUPS.flatMap(group=>group.items).find(item=>item.id==='logo-adicional');
  assert.equal(naming.price,10000);
  assert.equal(extraLogo.rate,0.25);
  const q = computeQuote({packageId:'branding', addonIds:['naming','logo-adicional']});
  assert.equal(q.subtotal,50000);
  assert.deepEqual(q.addons.map(a=>a.id), ['naming','logo-adicional']);
});

test('25% también aplica a identidad sin extras',()=>{
  const q=computeQuote({packageId:'identidad',addonIds:['logo-adicional']});
  assert.deepEqual([q.subtotal,q.total,q.advance,q.balance],[12500,12500,6250,6250]);
});
test('branding evita cobrar análisis de competencia dos veces',()=>{
  const q=computeQuote({packageId:'branding',addonIds:['analisis','logo-adicional']});
  assert.equal(q.subtotal,37500);
  assert.equal(q.addons.length,1);
  assert.match(buildQuoteText({packageId:'branding'}),/Análisis de competencia/);
});


test('estrategia y análisis son opciones en identidad y no cobran en branding',()=>{
 const base=computeQuote({packageId:'identidad',addonIds:['estrategia','analisis']});
 assert.equal(base.subtotal,10000+25000+8500);
 const full=computeQuote({packageId:'branding',addonIds:['estrategia','analisis']});
 assert.equal(full.subtotal,30000);
});
