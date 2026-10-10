import {PATTERNS,COLUMN_RANGES} from './data';
export const isMarked=(n,called,wildFives)=>n===0||(wildFives&&n%10===5)||called.includes(n);
export const isWild=(n,wildFives)=>wildFives&&n>0&&n%10===5;

// Builds every combination of `requiredPatterns` distinct enabled patterns per card.
// Double bingo: union of both patterns' squares, so a shared square only needs calling once.
export function cardResults(cards,called,enabledIds,wildFives=true,requiredPatterns=2,allPatterns=PATTERNS){
  if(requiredPatterns!==1&&requiredPatterns!==2)throw new Error('Only single (1) or double (2) pattern bingo is supported.');
  const calledSet=new Set(called);
  const marked=n=>n===0||(wildFives&&n%10===5)||calledSet.has(n);
  const options=allPatterns.filter(p=>enabledIds.includes(p.id));
  return cards.map((grid,index)=>{
    const numbers=grid.flat();
    const patterns=options.map(p=>({...p,missing:p.cells.map(c=>numbers[c]).filter(n=>!marked(n))}));
    const complete=patterns.filter(p=>p.missing.length===0);
    const pairs=[];
    if(requiredPatterns===1){
      for(const p of patterns)pairs.push({names:[p.name],ids:[p.id],cells:p.cells,missing:[...new Set(p.missing)]});
    }else{
      for(let i=0;i<patterns.length;i++)for(let j=i+1;j<patterns.length;j++){
        pairs.push({names:[patterns[i].name,patterns[j].name],ids:[patterns[i].id,patterns[j].id],cells:[...new Set([...patterns[i].cells,...patterns[j].cells])],missing:[...new Set([...patterns[i].missing,...patterns[j].missing])]});
      }
    }
    pairs.sort((a,b)=>a.missing.length-b.missing.length);
    return {index,numbers,complete,pairs,best:pairs[0]??null,win:complete.length>=requiredPatterns};
  }).sort((a,b)=>(a.best?.missing.length??99)-(b.best?.missing.length??99)||b.complete.length-a.complete.length||a.index-b.index);
}

// Exact: numbers that would give at least one card a bingo if called next.
export function oneBallWinners(results){
  const winners=new Map();
  for(const r of results){
    if(r.win)continue;
    for(const pair of r.pairs){
      if(pair.missing.length>1)break;
      if(pair.missing.length===1){
        const n=pair.missing[0];
        if(!winners.has(n))winners.set(n,new Set());
        winners.get(n).add(r.index);
      }
    }
  }
  return [...winners].map(([number,cards])=>({number,cards:[...cards].sort((a,b)=>a-b)})).sort((a,b)=>b.cards.length-a.cards.length||a.number-b.number);
}

// Squares of a completed pattern, with why each counts, for checking a bingo against the paper card.
export function verifyPattern(numbers,pattern,called,wildFives){
  return pattern.cells.map(cell=>{
    const n=numbers[cell];
    const reason=n===0?'free':isWild(n,wildFives)?'wild':called.includes(n)?'called':'missing';
    return {cell,number:n,reason,callOrder:reason==='called'?called.indexOf(n)+1:null};
  });
}

export const validCard=(card)=>Array.isArray(card)&&card.length===5&&card.every(row=>Array.isArray(row)&&row.length===5)&&card[2][2]===0&&card.flat().every((n,i)=>i===12||Number.isInteger(n)&&n>=1&&n<=75);

// Soft checks against standard 75-ball layout; flagged for manual review, never auto-corrected.
export function cardIssues(card){
  const issues=[];
  const seen=new Map();
  card.forEach((row,r)=>row.forEach((n,c)=>{
    if(r===2&&c===2)return;
    if(!Number.isInteger(n)||n<1||n>75){issues.push({cell:r*5+c,kind:'invalid',message:`Row ${r+1}, ${'BINGO'[c]}: missing or not 1–75`});return}
    const [low,high]=COLUMN_RANGES[c];
    if(n<low||n>high)issues.push({cell:r*5+c,kind:'column',message:`${n} is outside ${'BINGO'[c]} range ${low}–${high}`});
    if(seen.has(n))issues.push({cell:r*5+c,kind:'duplicate',message:`${n} appears twice`});
    seen.set(n,true);
  }));
  return issues;
}
