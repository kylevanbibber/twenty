import {COLUMN_RANGES} from './data';

export const HORIZONS=[1,3,5,10,15,20,30];

// Draw number (1-based) at which a card reaches `required` completed patterns, given each
// ball's position in a simulated draw order. Already-marked squares have position 0.
// A pattern completes when its last square is drawn; double bingo = 2nd earliest pattern.
function cardWinTime(numbers,patternCells,position,required){
  let first=Infinity,second=Infinity;
  for(const cells of patternCells){
    let done=0;
    for(const cell of cells){const p=position[numbers[cell]];if(p>done)done=p}
    if(done<first){second=first;first=done}else if(done<second)second=done;
  }
  return required===1?first:second;
}

function randomCard(random){
  const numbers=new Array(25);
  COLUMN_RANGES.forEach(([low],column)=>{
    const values=Array.from({length:15},(_,i)=>low+i);
    for(let i=0;i<5;i++){const k=i+Math.floor(random()*(15-i));[values[i],values[k]]=[values[k],values[i]]}
    for(let row=0;row<5;row++)numbers[row*5+column]=values[row];
  });
  numbers[12]=0;
  return numbers;
}

// Monte Carlo over random draw orders of the uncalled balls.
// wildsDrawn: wild 5 balls are still physically drawn (they use up calls but mark nothing new).
// opponents: number of other cards in the hall, modelled as random standard cards playing the
// same patterns. That is an assumption, so the UI labels it as a model rather than a prediction.
export function simulateOdds({cards,patterns,called,wildFives,required=2,wildsDrawn=false,opponents=0,trials=2000,random=Math.random}){
  const calledSet=new Set(called);
  const isWildNumber=n=>wildFives&&n%10===5;
  const pool=[];
  for(let n=1;n<=75;n++){
    if(calledSet.has(n))continue;
    if(isWildNumber(n)&&!wildsDrawn)continue;
    pool.push(n);
  }
  const patternCells=patterns.map(p=>p.cells);
  const flatCards=cards.map(card=>card.flat());
  const maxHorizon=pool.length;
  const yourTimes=new Array(maxHorizon+2).fill(0);
  const perCard=cards.map(()=>({withinHorizon:new Array(HORIZONS.length).fill(0),totalTime:0,finite:0}));
  let first=0,tie=0,beaten=0,neverWin=0;
  const position=new Int32Array(76);

  for(let t=0;t<trials;t++){
    position.fill(0);
    const order=pool.slice();
    for(let i=0;i<order.length;i++){const k=i+Math.floor(random()*(order.length-i));[order[i],order[k]]=[order[k],order[i]];position[order[i]]=i+1}
    // Wild numbers on a card are always marked, even when the ball is still in the drum.
    if(wildFives)for(let n=5;n<=75;n+=10)position[n]=0;
    let yours=Infinity;
    flatCards.forEach((numbers,index)=>{
      const time=cardWinTime(numbers,patternCells,position,required);
      if(time<yours)yours=time;
      const stats=perCard[index];
      if(Number.isFinite(time)){stats.totalTime+=time;stats.finite++}
      HORIZONS.forEach((h,i)=>{if(time<=h)stats.withinHorizon[i]++});
    });
    if(Number.isFinite(yours))yourTimes[Math.min(yours,maxHorizon+1)]++;else neverWin++;
    if(opponents>0){
      let theirs=Infinity;
      for(let o=0;o<opponents;o++){
        const time=cardWinTime(randomCard(random),patternCells,position,required);
        if(time<theirs)theirs=time;
        if(theirs<yours)break;
      }
      if(yours<theirs)first++;else if(yours===theirs&&Number.isFinite(yours))tie++;else beaten++;
    }
  }

  const cumulative=[];let running=0;
  for(let i=0;i<yourTimes.length;i++){running+=yourTimes[i];cumulative.push(running/trials)}
  const within=h=>cumulative[Math.min(h,cumulative.length-1)];
  let median=null;
  for(let i=0;i<cumulative.length;i++)if(cumulative[i]>=0.5){median=i;break}
  return {
    trials,
    remaining:pool.length,
    horizons:HORIZONS.map(h=>({calls:h,probability:within(h),margin:1.96*Math.sqrt(within(h)*(1-within(h))/trials)})),
    curve:cumulative,
    medianCalls:median,
    neverWin:neverWin/trials,
    perCard:perCard.map((s,index)=>({index,horizons:s.withinHorizon.map(c=>c/trials),averageCalls:s.finite?s.totalTime/s.finite:null})),
    competition:opponents>0?{opponents,first:first/trials,tie:tie/trials,beaten:beaten/trials}:null
  };
}
