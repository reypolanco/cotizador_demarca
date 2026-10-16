import {cp, mkdir, rm, copyFile} from 'node:fs/promises';
const files=['index.html','styles.css','fidelidad.css','app.js','quote-core.mjs'];
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of files) await copyFile(file,'dist/'+file);
await cp('assets','dist/assets',{recursive:true});
console.log('Cotizador compilado correctamente en dist/');
