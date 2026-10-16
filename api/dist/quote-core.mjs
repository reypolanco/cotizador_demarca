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
    description: 'El sistema visual esencial para que tu marca se vea profesional y consistente en todo lugar.',
    eyebrow: 'IDENTIDAD ESENCIAL',
  },
  {
    id: 'branding',
    name: 'Branding completo',
    price: 30000,
    description: 'Todo lo de identidad visual, más estrategia de marca, análisis de competencia y la personalidad y el tono con el que tu marca se expresa.',
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
  'Mini guía',
  'Usos correctos e incorrectos',
]);

export function includedFor(packageId) {
  return packageId === 'branding'
    ? [...BASE_INCLUDED, 'Personalidad y tono de marca', 'Estrategia de marca', 'Análisis de competencia']
    : [...BASE_INCLUDED];
}

// Tarifas ilustrativas de diseño, NO impresión/producción.
// Modifica los números de esta sección antes de enviar cotizaciones reales.
export const ADDON_GROUPS = Object.freeze([
  {
    title: 'Estrategia',
    items: [
      {id:'estrategia', name:'Estrategia de marca', price:25000, description:'Propósito, posicionamiento, público y propuesta de valor.'},
      {id:'analisis', name:'Análisis de competencia', price:8500, description:'Estudio visual y de mensaje de tu mercado.'},
      {id:'naming', name:'Naming', price:10000, description:'Creación y validación del nombre de tu marca.'},
    ],
  },
  {
    title:'Identidad extendida',
    items: [
      {id:'manual', name:'Manual de marca', price:12000, description:'Guía completa para aplicar tu identidad sin errores.'},
      {id:'animacion', name:'Animación de logo', price:9000, description:'Tu logotipo en movimiento para video y redes.'},
      {id:'isotipo', name:'Isotipo adicional', price:5500, description:'Símbolo complementario para usos reducidos.'},
    ],
  },
  {
    title:'Logotipo',
    items:[
      {id:'logo-adicional', name:'Propuesta de logo adicional', pricing:'percentage', rate:0.25, description:'Una propuesta de logotipo más para elegir. Suma el 25% al total de los servicios.'},
    ],
  },
]);

export const ADDONS = ADDON_GROUPS.flatMap(group => group.items);

export function formatDOP(amount) {
  if (!Number.isFinite(Number(amount))) return 'RD$0';
  return 'RD$' + Math.round(Number(amount)).toLocaleString('en-US');
}

export function formatAddonLabel(addon, resolvedPrice = addon?.price ?? 0) {
  if (addon?.pricing === 'percentage') return `+${Math.round((addon.rate || 0) * 100)}%`;
  return formatDOP(resolvedPrice);
}

export function computeQuote({packageId = 'identidad', addonIds = [], includeItbis = false} = {}) {
  const pkg = PACKAGES.find(p => p.id === packageId) ?? PACKAGES[0];
  const selected = new Set(Array.isArray(addonIds) ? addonIds : []);
  const selectedAddons = ADDONS.filter(a => selected.has(a.id));

  // La propuesta de logo se calcula sobre paquete + extras fijos antes de impuestos.
  const fixedAddons = selectedAddons.filter(a => a.pricing !== 'percentage' && !(pkg.id === 'branding' && ['analisis','estrategia'].includes(a.id)));
  const beforePercentage = pkg.price + fixedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const addons = selectedAddons
    .filter(a => !(pkg.id === 'branding' && ['analisis','estrategia'].includes(a.id)))
    .map(addon => {
      const price = addon.pricing === 'percentage'
        ? Math.round(beforePercentage * (addon.rate || 0))
        : Number(addon.price || 0);
      return {...addon, price, priceLabel: formatAddonLabel(addon, price)};
    });
  const subtotal = pkg.price + addons.reduce((sum, addon) => sum + addon.price, 0);
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
  if(q.addons.length){rows.push('', 'SERVICIOS ADICIONALES',...q.addons.map(a=>a.name+' — '+(a.pricing === 'percentage' ? `${formatDOP(a.price)} (${a.priceLabel})` : formatDOP(a.price))));}
  rows.push('','Subtotal: '+formatDOP(q.subtotal),'ITBIS (18%): '+(includeItbis?formatDOP(q.itbis):'No incluido'),'TOTAL ESTIMADO: '+formatDOP(q.total),'Anticipo (50%): '+formatDOP(q.advance),'Balance: '+formatDOP(q.balance));
  if(notes.trim())rows.push('','Notas: '+notes.trim());
  rows.push('','Cotización preliminar sujeta a confirmación de alcance, tiempos e impuestos. No incluye impresión ni producción.','Rey Polanco · Estrategia visual y branding');
  return rows.join('\n');
}
