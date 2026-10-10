import {PATTERNS} from './data';
export const isMarked=(n,called,wildFives)=>n===0||(wildFives&&n%10===5)||called.includes(n);
export function cardResults(cards,called,enabledIds,wildFives=true,requiredPatterns=2){
  const options=PATTERNS.filter(p=>enabledIds.includes(p.id));
  return cards.map((grid,index)=>{
    const numbers=grid.flat();
    const patterns=options.map(p=>({...p,missing:p.cells.map(c=>numbers[c]).filter(n=>!isMarked(n,called,wildFives))}));
    const complete=patterns.filter(p=>p.missing.length===0);
    // Generate all distinct pairs: only count two distinct patterns. A shared square
    // does not need to be called twice. Pair-based calculation for double bingo.
    const pairs=[];
    for(let i=0;i<patterns.length;i++)for(let j=i+1;j<patterns.length;j++){
      pairs.push({names:[patterns[i].name,patterns[j].name],ids:[patterns[i].id,patterns[j].id],cells:[...new Set([...patterns[i].cells,...patterns[j].cells])],missing:[...new Set([...patterns[i].missing,...patterns[j].missing])]});
    }
    pairs.sort((a,b)=>a.missing.length-b.missing.length);
    if(requiredPatterns!==2)throw new Error('This starter implements double bingo (2 patterns) only.');
    return {index,numbers,complete,pairs,best:pairs[0]??null,win:complete.length>=2};
  }).sort((a,b)=>(a.best?.missing.length??99)-(b.best?.missing.length??99)||b.complete.length-a.complete.length);
}
export function estimateOdds(results,called,wildFives,horizon=5,trials=4000){
  const pool=Array.from({length:75},(_,i)=>i+1).filter(n=>!called.includes(n)&&!(wildFives&&n%10===5));
  if(results.some(r=>r.win))return {probability:1,trials,remaining:pool.length};
  let hits=0;
  for(let t=0;t<trials;t++){
    const selected=new Set();const copy=pool.slice();
    for(let j=0;j<Math.min(horizon,copy.length);j++){
      const k=j+Math.floor(Math.random()*(copy.length-j));[copy[j],copy[k]]=[copy[k],copy[j]];selected.add(copy[j]);
    }
    if(results.some(r=>r.pairs.some(pair=>pair.missing.every(n=>selected.has(n)))))hits++;
  }
  return {probability:hits/trials,trials,remaining:pool.length};
}
export const validCard=(card)=>Array.isArray(card)&&card.length===5&&card.every(row=>Array.isArray(row)&&row.length===5)&&card[2][2]===0&&card.flat().every((n,i)=>i===12||Number.isInteger(n)&&n>=1&&n<=75);
