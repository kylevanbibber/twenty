import {COLUMN_RANGES} from './data';

const LOW_CONFIDENCE=75;

const median=values=>{if(!values.length)return null;const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]};

// Turns OCR words (text + confidence + bounding box) into a 5x5 card.
// Column comes from the number's value (B 1–15 … O 61–75), cross-checked against where the
// rest of that column sits so fragments of a neighbouring card are dropped. Rows come from
// clustering y positions by the grid spacing. Anything uncertain is flagged, never guessed.
export function wordsToCard(words){
  let candidates=[];
  for(const word of words){
    const digits=String(word.text).replace(/\D/g,'');
    if(!digits||digits.length>2)continue;
    const n=Number(digits);
    if(n<1||n>75)continue;
    const {x0,y0,x1,y1}=word.bbox;
    candidates.push({n,confidence:word.confidence??0,x:(x0+x1)/2,y:(y0+y1)/2,column:COLUMN_RANGES.findIndex(([low,high])=>n>=low&&n<=high)});
  }
  const grid=Array.from({length:5},()=>Array(5).fill(null));
  const flags=Array.from({length:5},()=>Array(5).fill(true));
  grid[2][2]=0;flags[2][2]=false;
  const empty={grid,flags,found:candidates.length,cells:null};
  if(candidates.length<5)return empty;

  const columnX=[0,1,2,3,4].map(c=>median(candidates.filter(k=>k.column===c).map(k=>k.x)));
  const knownX=columnX.map((x,c)=>[c,x]).filter(([,x])=>x!==null);
  const steps=knownX.slice(1).map(([c,x],i)=>(x-knownX[i][1])/(c-knownX[i][0])).filter(step=>step>0);
  const step=median(steps);
  if(!step)return empty;
  candidates=candidates.filter(k=>Math.abs(k.x-columnX[k.column])<=step*0.45);

  // Rows: split sorted y positions wherever the gap exceeds ~40% of a square; keep the 5
  // adjacent clusters holding the most numbers (extra clusters are neighbouring cards).
  const sorted=candidates.slice().sort((a,b)=>a.y-b.y);
  const clusters=[];
  for(const k of sorted){
    const last=clusters[clusters.length-1];
    if(last&&k.y-last[last.length-1].y<=step*0.4)last.push(k);else clusters.push([k]);
  }
  // The real card's middle row is the only one with nothing in N (the FREE square).
  let first=0,ambiguous=false;
  if(clusters.length>5){
    const scores=[];
    for(let i=0;i+5<=clusters.length;i++){
      const size=clusters.slice(i,i+5).reduce((t,c)=>t+c.length,0);
      scores.push(size+(clusters[i+2].some(k=>k.column===2)?0:100));
    }
    const best=Math.max(...scores);
    first=scores.indexOf(best);
    ambiguous=scores.filter(score=>score===best).length>1;
  }
  const rows=clusters.slice(first,first+5);
  const byCell=new Map();
  rows.forEach((cluster,row)=>cluster.forEach(k=>{
    if(row===2&&k.column===2)return;
    const key=row*5+k.column;
    byCell.set(key,[...(byCell.get(key)??[]),{...k,row}]);
  }));
  const placed=[];
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    if(r===2&&c===2)continue;
    const options=(byCell.get(r*5+c)??[]).sort((a,b)=>b.confidence-a.confidence);
    if(!options.length)continue;
    const conflict=options.some(o=>o.n!==options[0].n);
    grid[r][c]=options[0].n;
    flags[r][c]=conflict||ambiguous||options[0].confidence<LOW_CONFIDENCE||rows.length<5;
    placed.push(options[0]);
  }
  return {grid,flags,found:candidates.length,cells:cellGeometry(placed)};
}

const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;

// Estimates each square's centre from the numbers that were read, filling gaps by even spacing.
function cellGeometry(placed){
  const fill=centers=>{
    const known=centers.map((v,i)=>[i,v]).filter(([,v])=>v!==null);
    if(known.length<2)return null;
    const [i0,v0]=known[0],[i1,v1]=known[known.length-1];
    const step=(v1-v0)/(i1-i0);
    return {centers:centers.map((v,i)=>v??v0+(i-i0)*step),step};
  };
  const rows=fill([0,1,2,3,4].map(r=>average(placed.filter(p=>p.row===r).map(p=>p.y))));
  const columns=fill([0,1,2,3,4].map(c=>average(placed.filter(p=>p.column===c).map(p=>p.x))));
  if(!rows||!columns)return null;
  return {rowCenters:rows.centers,columnCenters:columns.centers,height:Math.abs(rows.step),width:Math.abs(columns.step)};
}

const flattenWords=data=>data.words??(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words)));

async function loadImage(file){
  const url=URL.createObjectURL(file);
  try{
    const image=new Image();
    image.src=url;
    await image.decode();
    return image;
  }finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
}

const WORK_WIDTH=1000;

function otsuThreshold(gray){
  const hist=new Array(256).fill(0);
  for(const v of gray)hist[v]++;
  const total=gray.length;
  let sumAll=0;for(let t=0;t<256;t++)sumAll+=t*hist[t];
  let weightBack=0,sumBack=0,best=0,threshold=128;
  for(let t=0;t<256;t++){
    weightBack+=hist[t];if(!weightBack)continue;
    const weightFore=total-weightBack;if(!weightFore)break;
    sumBack+=t*hist[t];
    const between=weightBack*weightFore*(sumBack/weightBack-(sumAll-sumBack)/weightFore)**2;
    if(between>best){best=between;threshold=t}
  }
  return threshold;
}

// Card borders make the OCR engine read a whole row as one long number, so long straight dark
// runs (much longer than a digit stroke) are erased first. Each run is measured on a band a few
// pixels thick so lines from a slightly tilted photo still count as one run.
function eraseLines(dark,width,height){
  const erase=new Uint8Array(dark.length);
  const band=Math.max(2,Math.round(width/250));
  const pass=(length,lines,index)=>{
    const minimum=Math.max(20,Math.floor(length/8));
    for(let line=0;line<lines;line++){
      const from=Math.max(0,line-band),to=Math.min(lines-1,line+band);
      const hit=i=>{for(let l=from;l<=to;l++)if(dark[index(l,i)])return true;return false};
      let i=0;
      while(i<length){
        if(!hit(i)){i++;continue}
        const start=i;
        while(i<length&&hit(i))i++;
        if(i-start>=minimum)for(let k=start;k<i;k++)if(dark[index(line,k)])erase[index(line,k)]=1;
      }
    }
  };
  pass(width,height,(y,x)=>y*width+x);
  pass(height,width,(x,y)=>y*width+x);
  return erase;
}

// Crops one tile of the sheet into a black-on-white canvas with grid lines removed.
function tileCanvas(image,rows,columns,row,column){
  const width=image.naturalWidth/columns,height=image.naturalHeight/rows;
  const scale=WORK_WIDTH/width;
  const canvas=document.createElement('canvas');
  canvas.width=WORK_WIDTH;canvas.height=Math.round(height*scale);
  const context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(image,column*width,row*height,width,height,0,0,canvas.width,canvas.height);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  const data=pixels.data;
  const gray=new Uint8Array(canvas.width*canvas.height);
  for(let i=0;i<gray.length;i++)gray[i]=Math.round(0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2]);
  const threshold=otsuThreshold(gray);
  const dark=gray.map(v=>v<=threshold?1:0);
  const erase=eraseLines(dark,canvas.width,canvas.height);
  for(let i=0;i<gray.length;i++){const v=dark[i]&&!erase[i]?0:255;data[i*4]=data[i*4+1]=data[i*4+2]=v}
  context.putImageData(pixels,0,0);
  return canvas;
}

// Second pass for squares the sparse read missed (often single digits): read each one alone.
async function fillMissing(worker,canvas,card){
  if(!card.cells)return card;
  const {rowCenters,columnCenters,width,height}=card.cells;
  const grid=card.grid.map(r=>r.slice()),flags=card.flags.map(r=>r.slice());
  await worker.setParameters({tessedit_pageseg_mode:'8'});
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    if(grid[r][c]!==null||(r===2&&c===2))continue;
    const left=Math.max(0,Math.round(columnCenters[c]-width*0.45)),top=Math.max(0,Math.round(rowCenters[r]-height*0.45));
    const rectangle={left,top,width:Math.min(Math.round(width*0.9),canvas.width-left),height:Math.min(Math.round(height*0.9),canvas.height-top)};
    if(rectangle.width<8||rectangle.height<8)continue;
    const {data}=await worker.recognize(canvas,{rectangle});
    const n=Number(String(data.text).replace(/\D/g,''));
    const [low,high]=COLUMN_RANGES[c];
    if(n>=low&&n<=high){grid[r][c]=n;flags[r][c]=true}
  }
  await worker.setParameters({tessedit_pageseg_mode:'11'});
  return {...card,grid,flags};
}

// Splits a photo into rows x columns cards (e.g. 3x3 for a 9-up sheet) and OCRs each one.
export async function scanSheet(file,{rows=1,columns=1,onProgress=()=>{}}={}){
  const {createWorker}=await import('tesseract.js');
  onProgress('Loading text reader…');
  // Absolute URLs: core and language paths are resolved inside the worker, not the page.
  const assets=new URL(`${import.meta.env.BASE_URL}tesseract/`,window.location.href).href;
  const worker=await createWorker('eng',1,{workerPath:`${assets}worker.min.js`,corePath:`${assets}core`,langPath:`${assets}lang`});
  try{
    await worker.setParameters({tessedit_char_whitelist:'0123456789',tessedit_pageseg_mode:'11'});
    const image=await loadImage(file);
    const cards=[];
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
      onProgress(`Reading card ${cards.length+1} of ${rows*columns}…`);
      const canvas=tileCanvas(image,rows,columns,r,c);
      const {data}=await worker.recognize(canvas,{},{blocks:true});
      const card=await fillMissing(worker,canvas,wordsToCard(flattenWords(data)));
      cards.push({grid:card.grid,flags:card.flags,preview:canvas.toDataURL('image/png')});
    }
    return cards;
  }finally{await worker.terminate()}
}
