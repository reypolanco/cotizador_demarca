import {createHmac, timingSafeEqual} from 'node:crypto';
import {PACKAGES, ADDONS, computeQuote, includedFor} from '../quote-core.mjs';

export const LINK_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_BODY_BYTES = 12_000;
const SAFE_ID = /^[0-9a-f]{40}$/;
const ADDON_IDS = new Set(ADDONS.map(item=>item.id));
const PACKAGE_IDS = new Set(PACKAGES.map(pkg=>pkg.id));

function cleanField(v,max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max) : '';
}
export function validateQuoteInput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('Datos de cotización inválidos.');
  const packageId = raw.packageId;
  if (typeof packageId !== 'string' || !PACKAGE_IDS.has(packageId)) throw new TypeError('Selecciona un paquete válido.');
  if (!Array.isArray(raw.addonIds) || raw.addonIds.length > ADDONS.length || raw.addonIds.some(id=>typeof id !== 'string' || !ADDON_IDS.has(id))) {
    throw new TypeError('La selección de servicios no es válida.');
  }
  if (typeof raw.includeItbis !== 'boolean') throw new TypeError('El valor del ITBIS debe ser verdadero o falso.');
  const state = {
    packageId,
    addonIds:[...new Set(raw.addonIds)],
    includeItbis:raw.includeItbis,
    clientName:cleanField(raw.clientName,100),
    brandName:cleanField(raw.brandName,100),
    email:cleanField(raw.email,150),
    notes:cleanField(raw.notes,700),
  };
  if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) throw new TypeError('El correo no es válido.');
  return {state, quote:computeQuote(state), included:includedFor(packageId)};
}

function ensureSecret(secret){
  if(typeof secret !== 'string' || Buffer.byteLength(secret,'utf8') < 32) throw new Error('QUOTE_LINK_SECRET missing or short');
}
export function createSignature(id, expiry, secret) {
  ensureSecret(secret);
  if (!SAFE_ID.test(id) || !Number.isSafeInteger(expiry)) throw new TypeError('Parámetros del enlace inválidos');
  return createHmac('sha256', secret).update(`v1.${id}.${expiry}`).digest('base64url');
}
export function checkSignature(id, expiry, signature, secret, now=Date.now()) {
  if(!SAFE_ID.test(id) || !Number.isSafeInteger(expiry) || expiry < now || expiry > now + LINK_VALIDITY_MS + 60_000) return false;
  if(typeof signature !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;
  try {
    const expected = Buffer.from(createSignature(id,expiry,secret));
    const provided = Buffer.from(signature);
    return expected.length === provided.length && timingSafeEqual(expected,provided);
  } catch {return false;}
}
export function quoteFilePath(id){
  if (!SAFE_ID.test(id)) throw new TypeError('ID inválido');
  return `cotizaciones/${id}.pdf`;
}
