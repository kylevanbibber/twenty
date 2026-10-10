// Copies the OCR engine and English data into public/ so scanning is served from this site
// instead of a third-party CDN that a venue's network might block.
import {copyFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';

const require=createRequire(import.meta.url);
const out=join(process.cwd(),'public','tesseract');
const core=dirname(require.resolve('tesseract.js-core/package.json'));
const tesseract=dirname(require.resolve('tesseract.js/package.json'));
const lang=dirname(require.resolve('@tesseract.js-data/eng/package.json'));

for(const dir of ['core','lang'])mkdirSync(join(out,dir),{recursive:true});
copyFileSync(join(tesseract,'dist','worker.min.js'),join(out,'worker.min.js'));
for(const file of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js'])copyFileSync(join(core,file),join(out,'core',file));
copyFileSync(join(lang,'4.0.0_best_int','eng.traineddata.gz'),join(out,'lang','eng.traineddata.gz'));
console.log('OCR assets copied to public/tesseract');
