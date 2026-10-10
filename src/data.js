// Transcribed from the TWO MOST RECENT photographed bingo sheets (October 2026).
// IMPORTANT: Visually verify the numbers before using for real games; OCR/manual reading can be wrong.
// Cards 1–9 = photo with 15-13810-09 rotated sideways; cards 10–18 = upright photo.
export const INITIAL_CARDS = [
[[9,21,42,57,69],[4,27,45,55,65],[1,25,0,50,61],[14,23,35,46,64],[6,16,31,47,74]],
[[1,20,31,56,61],[2,24,37,51,71],[6,17,0,46,63],[15,16,39,47,65],[9,23,36,60,68]],
[[11,20,45,46,66],[9,29,31,56,61],[1,16,0,60,75],[15,23,37,58,67],[10,30,35,59,70]],
[[13,30,33,48,72],[12,20,35,52,74],[9,18,0,56,73],[15,23,37,50,67],[2,27,40,54,62]],
[[8,29,38,49,75],[13,21,32,51,69],[9,30,0,55,67],[14,25,34,59,62],[3,18,37,54,74]],
[[5,17,39,47,73],[10,19,40,52,62],[14,28,0,56,65],[2,27,41,50,70],[6,30,32,57,64]],
[[12,30,45,57,72],[14,19,39,50,73],[6,23,0,60,69],[9,28,38,55,64],[5,24,43,52,75]],
[[15,18,43,51,69],[11,28,45,55,70],[6,30,0,56,66],[13,22,40,54,71],[5,19,39,48,63]],
[[14,29,41,60,64],[8,23,42,55,74],[11,27,0,54,75],[9,19,35,57,70],[5,25,36,52,68]],
[[1,24,39,57,72],[3,27,33,59,63],[15,30,0,54,73],[4,17,45,49,61],[14,16,31,46,69]],
[[14,19,43,48,65],[2,23,42,57,72],[15,25,0,50,63],[11,17,34,56,71],[13,28,35,51,66]],
[[14,17,35,51,62],[10,27,44,58,68],[2,21,0,59,63],[8,26,42,47,74],[9,23,36,56,72]],
[[3,19,45,60,73],[11,18,41,53,74],[10,20,0,54,70],[5,26,43,58,67],[9,23,33,57,75]],
[[7,28,35,59,70],[5,22,34,50,69],[10,27,0,52,74],[14,23,36,49,68],[13,21,44,58,63]],
[[13,20,44,50,65],[11,21,37,48,64],[9,27,0,52,67],[7,19,36,60,66],[10,23,41,58,71]],
[[1,23,35,49,73],[10,18,44,54,61],[3,19,0,53,70],[8,22,31,46,62],[15,16,33,60,74]],
[[1,18,41,49,70],[2,26,35,57,74],[4,23,0,52,67],[9,16,42,51,63],[10,28,39,46,61]],
[[3,19,41,54,66],[8,24,33,48,68],[13,17,0,55,71],[2,22,39,49,63],[15,20,32,53,62]]
];
const H = Array.from({length:5},(_,r)=>({id:`horizontal-${r+1}`,name:`Horizontal row ${r+1}`,cells:Array.from({length:5},(_,c)=>r*5+c)}));
const V = Array.from({length:5},(_,c)=>({id:`vertical-${c+1}`,name:`Vertical column ${c+1}`,cells:Array.from({length:5},(_,r)=>r*5+c)}));
// Pattern grid is row-major indexed 0..24; center index 12 is FREE.
// Specialty configurations are based on the previous prototype and should be verified
// against the hall's printed pattern sheet. Some patterns have multiple valid orientations.
export const PATTERNS=[
...H,...V,
{id:'diag-down',name:'Diagonal ↘',cells:[0,6,12,18,24]},
{id:'diag-up',name:'Diagonal ↙',cells:[4,8,12,16,20]},
{id:'four-corners',name:'Four Corners',cells:[0,4,20,24]},
{id:'little-diamond',name:'Little Diamond',cells:[7,11,13,17]},
{id:'big-diamond',name:'Big Diamond',cells:[2,10,14,22]},
{id:'v-left',name:'V (top)',cells:[0,4,6,8,12]},
{id:'v-bottom',name:'V (bottom)',cells:[10,14,16,18,22]},
{id:'postage-top-left',name:'Postage Stamp (top left)',cells:[0,1,5,6]},
{id:'postage-top-right',name:'Postage Stamp (top right)',cells:[3,4,8,9]},
{id:'postage-bottom-left',name:'Postage Stamp (bottom left)',cells:[15,16,20,21]},
{id:'postage-bottom-right',name:'Postage Stamp (bottom right)',cells:[18,19,23,24]},
{id:'inside-four-corners',name:'Inside Four Corners',cells:[6,8,16,18]},
{id:'goofy-kite',name:'Goofy Kite',cells:[0,1,4,5,6,8,12]},
{id:'letter-x',name:'Letter X',cells:[0,4,6,8,12,16,18,20,24]},
{id:'baseball-diamond',name:'Baseball Diamond',cells:[0,4,18,19,20,23,24]},
{id:'double-cross',name:'Double Cross',cells:[2,6,7,8,12,16,17,18,22]},
{id:'four-leaf-clover',name:'Four-Leaf Clover',cells:[0,1,3,4,5,6,8,9,15,16,18,19,20,21,23,24]},
{id:'coverall',name:'Coverall',cells:Array.from({length:25},(_,i)=>i)}
];
export const WILDS=[5,15,25,35,45,55,65,75];
export const initialGame=()=>({id:crypto.randomUUID(),name:'Double bingo — wild 5s',cards:structuredClone(INITIAL_CARDS),called:[],wildFives:true,requiredPatterns:2,enabledIds:PATTERNS.map(p=>p.id),selected:0,updatedAt:new Date().toISOString()});
