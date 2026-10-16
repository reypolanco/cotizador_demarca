import {
  BRAND, PACKAGES, ADDON_GROUPS, ADDONS, includedFor, computeQuote,
  formatDOP, formatAddonLabel, buildQuoteText,
} from './quote-core.mjs';

const STORE_KEY = 'rey-polanco-cotizador-v1';
const defaultState = () => ({packageId:'identidad', addonIds:[], includeItbis:false, clientName:'', brandName:'', email:'', notes:''});
function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaultState();
    const valid = new Set(ADDONS.map(a => a.id));
    return {
      packageId:PACKAGES.some(p=>p.id===saved.packageId)?saved.packageId:'identidad',
      addonIds:Array.isArray(saved.addonIds)?saved.addonIds.filter(id=>valid.has(id)):[],
      includeItbis:saved.includeItbis === true,
      clientName:typeof saved.clientName==='string'?saved.clientName.slice(0,100):'',
      brandName:typeof saved.brandName==='string'?saved.brandName.slice(0,100):'',
      email:typeof saved.email==='string'?saved.email.slice(0,150):'',
      notes:typeof saved.notes==='string'?saved.notes.slice(0,700):'',
    };
  }catch{return defaultState();}
}
let state=loadState();
const byId=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const currency=formatDOP;
const pageTitle='Rey Polanco · Cotizador';
let toastTimer;
function toast(msg){const element=byId('toast');element.textContent=msg;element.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove('show'),3500);}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch{/* Browser private mode or storage blocked */}}


function addonAmountLabel(addon){
  return addon.pricing === 'percentage'
    ? `${currency(addon.price)} (${formatAddonLabel(addon, addon.price)})`
    : currency(addon.price);
}

function renderPackages(){
  const root=byId('package-options');
  root.innerHTML=PACKAGES.map(pkg=>{
    const selected=pkg.id===state.packageId;
    return `<button type="button" class="package-card ${selected?'selected':''}" role="radio" aria-checked="${selected}" data-package="${pkg.id}">
      <div class="package-card-head"><span class="package-eyebrow">${escapeHTML(pkg.eyebrow)}</span><span class="package-radio" aria-hidden="true"></span></div>
      <h3>${escapeHTML(pkg.name)}</h3><p>${escapeHTML(pkg.description)}</p>
      <div class="package-price">${currency(pkg.price)}</div>
    </button>`;
  }).join('');
  root.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    state.packageId=btn.dataset.package;
    if (state.packageId === 'branding') state.addonIds=state.addonIds.filter(id=>!['analisis','estrategia'].includes(id));
    renderPackages();renderIncluded();renderAddons();updateSummary();persist();
    // Retain keyboard focus after selection.
    root.querySelector(`[data-package="${state.packageId}"]`)?.focus({preventScroll:true});
  }));
}
function renderIncluded(){byId('included-items').innerHTML=includedFor(state.packageId).map(x=>`<li>${escapeHTML(x)}</li>`).join('');}
function renderAddons(){
  const root=byId('addon-options');
  root.innerHTML=ADDON_GROUPS.map(group=>`<div class="addon-category"><h3 class="addon-category-name">${escapeHTML(group.title)}</h3><div class="addon-grid">${group.items.filter(addon => !(state.packageId==='branding' && ['analisis','estrategia'].includes(addon.id))).map(addon=>{
    const chosen=state.addonIds.includes(addon.id);
    return `<button type="button" class="addon-card ${chosen?'selected':''}" data-addon="${escapeHTML(addon.id)}" aria-pressed="${chosen}">
      <span class="addon-icon" aria-hidden="true">${chosen?'✓':'+'}</span>
      <span class="addon-content"><span class="addon-heading"><span class="addon-name">${escapeHTML(addon.name)}</span><span class="addon-price">${escapeHTML(formatAddonLabel(addon))}</span></span><span class="addon-description">${escapeHTML(addon.description)}</span></span>
    </button>`;
  }).join('')}</div></div>`).join('');
  root.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.addon;
    state.addonIds=state.addonIds.includes(id)?state.addonIds.filter(x=>x!==id):[...state.addonIds,id];
    const selected=state.addonIds.includes(id);
    btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));btn.querySelector('.addon-icon').textContent=selected?'✓':'+';
    updateSummary();persist();
  }));
}
function updateSummary(){
  const quote=computeQuote(state);
  byId('summary-package').innerHTML=`<strong>${escapeHTML(quote.pkg.name)}</strong><span>${currency(quote.pkg.price)}</span>`;
  byId('summary-addons').innerHTML=quote.addons.length?`<div class="summary-addons-title">SERVICIOS ADICIONALES</div>`+quote.addons.map(a=>`<div class="selected-addon-line"><span>${escapeHTML(a.name)}</span><strong>${escapeHTML(addonAmountLabel(a))}</strong></div>`).join(''):'<p class="empty-addons">Aún no has agregado servicios adicionales.</p>';
  byId('subtotal').textContent=currency(quote.subtotal);
  byId('tax-row').hidden=!state.includeItbis;
  byId('itbis').textContent=currency(quote.itbis);
  byId('total').textContent=currency(quote.total);
  byId('advance').textContent=currency(quote.advance);
  byId('balance').textContent=currency(quote.balance);
  document.title=pageTitle;
}
function buildPrint(){
  const q=computeQuote(state);
  const list=items=>items.map(x=>`<li>${escapeHTML(x)}</li>`).join('');
  const line=(label,amount,extra='')=>`<div class="print-row ${extra}"><span>${escapeHTML(label)}</span><strong>${typeof amount === 'number' ? currency(amount) : escapeHTML(amount)}</strong></div>`;
  const date=new Date().toLocaleDateString('es-DO',{year:'numeric',month:'long',day:'numeric'});
  byId('print-sheet').innerHTML=`<div class="print-head"><div><div class="print-name">REY POLANCO<b>.</b></div><div class="print-sub">ESTRATEGIA VISUAL · BRANDING</div></div><div class="print-title"><strong>COTIZACIÓN ESTIMADA</strong><div class="print-sub">${escapeHTML(date)}</div></div></div>
  <div class="print-info"><div><span class="print-label">Cliente</span><strong>${escapeHTML(state.clientName.trim()||'Por definir')}</strong></div><div><span class="print-label">Marca / proyecto</span><strong>${escapeHTML(state.brandName.trim()||'Por definir')}</strong></div></div>
  ${state.email.trim()?`<div><span class="print-label">Correo</span>${escapeHTML(state.email.trim())}</div>`:''}
  <div class="print-section">Paquete de diseño</div>${line(q.pkg.name,q.pkg.price)}
  <ul class="print-items">${list(includedFor(state.packageId))}</ul>
  ${q.addons.length?`<div class="print-section">Servicios adicionales</div>${q.addons.map(a=>line(a.name,addonAmountLabel(a))).join('')}`:''}
  <div class="print-totals">${line('Subtotal',q.subtotal)}${state.includeItbis?line('ITBIS (18 %)',q.itbis):''}${line('TOTAL ESTIMADO',q.total,'print-total')}${line('Anticipo (50 %)',q.advance)}${line('Balance pendiente',q.balance)}</div>
  ${state.notes.trim()?`<div class="print-notes"><strong>Notas:</strong> ${escapeHTML(state.notes.trim())}</div>`:''}
  <div class="print-bottom">Esta propuesta es preliminar y está sujeta a confirmación de alcance, tiempos e impuestos. Solo incluye servicios de diseño; no contempla impresión ni producción física.<br>Rey Polanco · ${escapeHTML(BRAND.email)} · ${escapeHTML(BRAND.landing)}</div>`;
}
async function copyQuote(){
  const quote=buildQuoteText(state);
  try {await navigator.clipboard.writeText(quote);toast('Resumen copiado al portapapeles.');}
  catch {
    const input=document.createElement('textarea');input.value=quote;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const success=document.execCommand('copy');input.remove();toast(success?'Resumen copiado.':'No se pudo copiar automáticamente.');
  }
}
async function requestQuote(){
  const btn=byId('whatsapp-btn');
  if(btn.disabled) return;
  // Abre una pestaña inmediatamente para evitar el bloqueo de ventanas emergentes.
  const whatsappTab=window.open('about:blank','_blank');
  if(whatsappTab){try{whatsappTab.document.body.innerHTML='<p style="font-family:Arial,sans-serif;padding:24px">Generando tu cotización en PDF…</p>';}catch{}}
  btn.disabled=true;
  btn.setAttribute('aria-busy','true');
  byId('generated-quote').hidden=true;
  toast('Generando PDF y creando enlace privado…');
  try{
    const response=await fetch('/api/cotizacion',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(state),
      cache:'no-store',
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok || !payload.url) throw new Error(payload.error || 'No se pudo generar el PDF.');
    const secureLink=payload.url;
    const box=byId('generated-quote');
    box.hidden=false;
    const anchor=byId('generated-pdf-link');
    anchor.href=secureLink;
    const message=`Hola, quisiera solicitar una cotización de branding. Aquí está el PDF con los servicios y el presupuesto seleccionado (enlace válido durante 7 días):\n${secureLink}`;
    const phone=BRAND.whatsapp.replace(/[^\d]/g,'');
    const whatsappUrl=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    if(whatsappTab && !whatsappTab.closed){whatsappTab.location.replace(whatsappUrl)}
    else window.location.assign(whatsappUrl);
    toast('PDF creado. Confirma el envío del enlace en WhatsApp.');
  }catch(error){
    if(whatsappTab&&!whatsappTab.closed)whatsappTab.close();
    toast(error?.message || 'Error al crear el PDF. Vuelve a intentarlo.');
  }finally{
    btn.disabled=false;
    btn.removeAttribute('aria-busy');
  }
}

function resetQuote(){
  if(!window.confirm('¿Quieres borrar los datos y reiniciar la cotización?'))return;
  state=defaultState();
  ['client-name','brand-name','email','notes'].forEach((id,i)=>{byId(id).value=['','','',''][i];});
  byId('include-itbis').checked=false;
  byId('generated-quote').hidden=true;
  renderPackages();renderIncluded();renderAddons();updateSummary();persist();
  toast('Cotización reiniciada.');window.scrollTo({top:0,behavior:'smooth'});
}
function init(){
  document.querySelectorAll('.brand,.back-link,.footer-brand').forEach(a=>a.href=BRAND.landing);
  renderPackages();renderIncluded();renderAddons();
  const keys={'client-name':'clientName','brand-name':'brandName',email:'email',notes:'notes'};
  Object.entries(keys).forEach(([id,key])=>{const field=byId(id);field.value=state[key];field.addEventListener('input',()=>{state[key]=field.value;persist();});});
  byId('include-itbis').checked=state.includeItbis;
  byId('include-itbis').addEventListener('change',e=>{state.includeItbis=e.target.checked;updateSummary();persist();});
  byId('copy-btn').addEventListener('click',copyQuote);
  byId('copy-pdf-link').addEventListener('click', async ()=>{
    const url=byId('generated-pdf-link').href;
    if(!url || url.endsWith('#')) return;
    try{await navigator.clipboard.writeText(url);toast('Enlace al PDF copiado.');}
    catch{toast('Selecciona el enlace para copiarlo manualmente.');}
  });
  byId('whatsapp-btn').addEventListener('click',requestQuote);
  byId('print-btn').addEventListener('click',()=>{buildPrint();window.print();});
  byId('reset-btn').addEventListener('click',resetQuote);
  updateSummary();
}
init();
