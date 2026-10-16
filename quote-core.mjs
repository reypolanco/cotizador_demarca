/**
 * REY POLANCO — Catálogo editable del cotizador.
 * Los precios base están confirmados. Los adicionales son PRECIOS DE EJEMPLO:
 * revísalos antes de utilizar el sitio comercialmente.
 */
export const BRAND = Object.freeze({
  name: 'Rey Polanco',
  landing: 'https://rey-polanco-vercel.vercel.app/',
  whatsapp: '18298815181',
  email: 'brandssfm@gmail.com',
  currency: 'DOP',
});

export const FINANCE = Object.freeze({itbisRate: 0.18, advanceRate: 0.5});

export const PACKAGES = Object.freeze([
  {
    id: 'identidad',
    name: 'Identidad visual',
    price: 10000,
    description: 'El sistema visual esencial para que tu marca sea profesional, consistente y reconocible.',
    eyebrow: 'IDENTIDAD ESENCIAL',
  },
  {
    id: 'branding',
    name: 'Branding completo',
    price: 20000,
    description: 'La identidad visual más personalidad, voz y dirección estratégica de marca.',
    eyebrow: 'SOLUCIÓN INTEGRAL',
  },
]);

export const BASE_INCLUDED = Object.freeze([
  'Brief y concepto',
  'Logotipo principal',
  'Variantes del logotipo',
  'Archivos finales',
  'Paleta de colores',
  'Tipografía',
  'Diseño de papelería básica',
  'Retículas',
  'Mini guía de marca',
  'Usos correctos e incorrectos',
]);

export function includedFor(packageId) {
  return packageId === 'branding'
    ? [...BASE_INCLUDED, 'Personalidad y tono de marca']
    : [...BASE_INCLUDED];
}

// Tarifas ilustrativas de diseño, NO impresión/producción.
// Modifica los números de esta sección antes de enviar cotizaciones reales.
export const ADDON_GROUPS = Object.freeze([
  {
    title: 'Estrategia',
    subtitle: 'Profundiza en las decisiones que hacen distinta a tu marca.',
    items: [
      {id:'naming', name:'Naming de marca', price:7500, description:'Propuestas de nombres y criterios para su selección.'},
      {id:'eslogan', name:'Eslogan de marca', price:3500, description:'Concepto verbal y frase de posicionamiento.'},
      {id:'analisis', name:'Análisis competitivo', price:6000, description:'Exploración de mercado y referencias de categoría.'},
      {id:'manual', name:'Manual de marca extendido', price:8000, description:'Normas, aplicaciones y lineamientos avanzados.'},
    ],
  },
]);

export const ADDONS = ADDON_GROUPS.flatMap(group => group.items);

export function formatDOP(amount) {
  if (!Number.isFinite(Number(amount))) return 'RD$0';
  return 'RD$' + Math.round(Number(amount)).toLocaleString('en-US');
}

export function computeQuote({packageId = 'identidad', addonIds = [], includeItbis = false} = {}) {
  const pkg = PACKAGES.find(p => p.id === packageId) ?? PACKAGES[0];
  const selected = new Set(Array.isArray(addonIds) ? addonIds : []);
  const addons = ADDONS.filter(a => selected.has(a.id));
  const subtotal = pkg.price + addons.reduce((sum, a) => sum + a.price, 0);
  const itbis = includeItbis ? Math.round(subtotal * FINANCE.itbisRate) : 0;
  const total = subtotal + itbis;
  const advance = Math.round(total * FINANCE.advanceRate);
  return {pkg, addons, subtotal, itbis, total, advance, balance:total - advance};
}

export function buildQuoteText({packageId,addonIds,includeItbis,clientName='',brandName='',email='',notes=''} = {}) {
  const q=computeQuote({packageId,addonIds,includeItbis});
  const rows=[
    'COTIZACIÓN ESTIMADA · REY POLANCO',
    '',
    'Cliente: ' + (clientName.trim() || 'Por definir'),
    'Marca: ' + (brandName.trim() || 'Por definir'),
    ...(email.trim()?['Correo: '+email.trim()]:[]),
    '',
    'PAQUETE BASE',
    q.pkg.name + ' — ' + formatDOP(q.pkg.price),
    ...includedFor(q.pkg.id).map(item=>'✓ '+item),
  ];
  if(q.addons.length){rows.push('', 'SERVICIOS ADICIONALES',...q.addons.map(a=>a.name+' — '+formatDOP(a.price)));}
  rows.push('','Subtotal: '+formatDOP(q.subtotal),'ITBIS (18%): '+(includeItbis?formatDOP(q.itbis):'No incluido'),'TOTAL ESTIMADO: '+formatDOP(q.total),'Anticipo (50%): '+formatDOP(q.advance),'Balance: '+formatDOP(q.balance));
  if(notes.trim())rows.push('','Notas: '+notes.trim());
  rows.push('','Cotización preliminar sujeta a confirmación de alcance, tiempos e impuestos. No incluye impresión ni producción.','Rey Polanco · Estrategia visual y branding');
  return rows.join('\n');
}
