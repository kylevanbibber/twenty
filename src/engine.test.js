import {describe,expect,it} from 'vitest';
import {INITIAL_CARDS,PATTERNS,WILDS,initialGame,normalizeGame} from './data';
import {cardIssues,cardResults,isMarked,oneBallWinners,validCard,verifyPattern} from './engine';
import {simulateOdds} from './odds';
import {wordsToCard} from './scan';

const ALL=PATTERNS.map(p=>p.id);
const pattern=id=>PATTERNS.find(p=>p.id===id);
// Card with no 5-ending numbers, so wild rules don't interfere unless a test wants them.
const PLAIN=[[1,16,31,46,61],[2,17,32,47,62],[3,18,0,48,63],[4,19,33,49,64],[6,20,34,50,66]];
const resultFor=(called,enabledIds,options={})=>cardResults([PLAIN],called,enabledIds,options.wildFives??false,options.required??2)[0];

describe('original data',()=>{
  it('keeps all 18 transcribed cards valid with a FREE center',()=>{
    expect(INITIAL_CARDS).toHaveLength(18);
    expect(INITIAL_CARDS.every(validCard)).toBe(true);
  });
  it('treats every number ending in 5 as wild',()=>{
    expect(WILDS).toEqual([5,15,25,35,45,55,65,75]);
    WILDS.forEach(n=>expect(isMarked(n,[],true)).toBe(true));
    WILDS.forEach(n=>expect(isMarked(n,[],false)).toBe(false));
  });
  it('migrates v1 saves without losing cards or calls',()=>{
    const v1={id:'abc',name:'Old',cards:INITIAL_CARDS,called:[3,9],wildFives:true,requiredPatterns:2,enabledIds:['four-corners'],selected:4,updatedAt:'2026-01-01T00:00:00Z'};
    const game=normalizeGame(v1);
    expect(game.called).toEqual([3,9]);
    expect(game.customPatterns).toEqual([]);
    expect(game.verified).toHaveLength(18);
    expect(game.selected).toBe(4);
  });
});

describe('FREE center',()=>{
  it('counts automatically toward patterns through the center',()=>{
    const result=resultFor([3,4,1,2,6],['horizontal-3','vertical-1']);
    // Row 3 still needs 18, 48, 63 — center is not missing.
    const row=result.pairs[0];
    expect(row.missing).not.toContain(0);
  });
  it('completes a diagonal with only four calls',()=>{
    const result=resultFor([1,17,49,66],['diag-down'],{required:1});
    expect(result.win).toBe(true);
  });
});

describe('double bingo',()=>{
  it('does not win with one completed pattern',()=>{
    const result=resultFor([1,2,3,4,6],['vertical-1','vertical-2']);
    expect(result.complete).toHaveLength(1);
    expect(result.win).toBe(false);
  });
  it('wins with two distinct completed patterns',()=>{
    const result=resultFor([1,2,3,4,6,16,17,18,19,20],['vertical-1','vertical-2']);
    expect(result.win).toBe(true);
  });
  it('counts a shared square only once for overlapping patterns',()=>{
    // Row 1 and column 1 share square 0 (number 1): 9 unique numbers, not 10.
    const result=resultFor([],['horizontal-1','vertical-1']);
    expect(result.best.missing).toHaveLength(9);
    const won=resultFor([1,16,31,46,61,2,3,4,6],['horizontal-1','vertical-1']);
    expect(won.win).toBe(true);
  });
  it('wins when overlapping patterns share squares (four corners + diagonal)',()=>{
    const result=resultFor([1,61,6,66,17,49],['four-corners','diag-down']);
    expect(result.win).toBe(true);
  });
  it('ignores patterns that are disabled',()=>{
    const result=resultFor([1,2,3,4,6,16,17,18,19,20],['vertical-1']);
    expect(result.win).toBe(false);
  });
});

describe('wild 5s',()=>{
  const WILD_CARD=[[5,16,31,46,61],[15,17,32,47,62],[3,18,0,48,63],[4,19,33,49,64],[6,20,34,50,66]];
  it('marks wild numbers without calling them',()=>{
    const [result]=cardResults([WILD_CARD],[3,4,6],['vertical-1'],true,1);
    expect(result.win).toBe(true);
  });
  it('does not mark them when wilds are off',()=>{
    const [result]=cardResults([WILD_CARD],[3,4,6],['vertical-1'],false,1);
    expect(result.win).toBe(false);
    expect(result.best.missing.sort()).toEqual([15,5]);
  });
});

describe('winning alerts',()=>{
  it('lists exactly the numbers that would win on the next ball',()=>{
    // Column 1 done; column 2 needs only 20.
    const results=cardResults([PLAIN],[1,2,3,4,6,16,17,18,19],['vertical-1','vertical-2'],false,2);
    expect(oneBallWinners(results)).toEqual([{number:20,cards:[0]}]);
  });
  it('explains each square of a winning pattern for paper verification',()=>{
    const cells=verifyPattern(PLAIN.flat(),pattern('diag-down'),[1,17,49,66],false);
    expect(cells.map(c=>c.reason)).toEqual(['called','called','free','called','called']);
    expect(cells[0].callOrder).toBe(1);
  });
  it('flags the original 18 cards as winning only when patterns are really complete',()=>{
    const game=initialGame();
    const results=cardResults(game.cards,[],ALL,true,2);
    results.filter(r=>r.win).forEach(r=>expect(r.complete.length).toBeGreaterThanOrEqual(2));
  });
});

describe('card checks',()=>{
  it('flags numbers outside their column and duplicates',()=>{
    const bad=PLAIN.map(r=>r.slice());bad[0][0]=20;bad[1][1]=16;
    const kinds=cardIssues(bad).map(i=>i.kind);
    expect(kinds).toContain('column');
    expect(kinds).toContain('duplicate');
    expect(cardIssues(PLAIN)).toEqual([]);
  });
});

describe('odds',()=>{
  const patterns=PATTERNS.map(({id,cells})=>({id,cells}));
  it('is certain once a card has already won',()=>{
    const odds=simulateOdds({cards:[PLAIN],patterns,called:[1,2,3,4,6,16,17,18,19,20],wildFives:false,trials:50});
    expect(odds.horizons.every(h=>h.probability===1)).toBe(true);
  });
  it('matches the exact next-ball chance',()=>{
    const called=[1,2,3,4,6,16,17,18,19];
    const odds=simulateOdds({cards:[PLAIN],patterns:[pattern('vertical-1'),pattern('vertical-2')],called,wildFives:false,trials:20000});
    const exact=1/(75-called.length);
    expect(Math.abs(odds.horizons[0].probability-exact)).toBeLessThan(0.01);
  });
  it('is never more likely when wild balls take up calls',()=>{
    let seed=1;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const base={cards:INITIAL_CARDS,patterns,called:[],wildFives:true,trials:1500};
    const skipped=simulateOdds({...base,random});
    seed=1;
    const drawn=simulateOdds({...base,wildsDrawn:true,random});
    expect(drawn.horizons[3].probability).toBeLessThanOrEqual(skipped.horizons[3].probability+0.03);
  });
  it('reports competition shares that add up to 1',()=>{
    const odds=simulateOdds({cards:INITIAL_CARDS,patterns,called:[],wildFives:true,opponents:50,trials:200});
    const {first,tie,beaten}=odds.competition;
    expect(first+tie+beaten).toBeCloseTo(1,5);
  });
});

describe('scan parsing',()=>{
  const word=(text,col,row,confidence=95)=>({text:String(text),confidence,bbox:{x0:col*100,x1:col*100+40,y0:row*100,y1:row*100+40}});
  it('rebuilds a card from OCR words',()=>{
    const words=[];
    PLAIN.forEach((row,r)=>row.forEach((n,c)=>{if(n)words.push(word(n,c,r))}));
    words.push(word('FREE',2,2));
    const {grid,flags}=wordsToCard(words.sort(()=>0.5-Math.random()));
    expect(grid).toEqual(PLAIN);
    expect(flags.flat().some(Boolean)).toBe(false);
  });
  it('drops fragments of a neighbouring card instead of misplacing them',()=>{
    const words=[];
    PLAIN.forEach((row,r)=>row.forEach((n,c)=>{if(n)words.push(word(n,c,r))}));
    // Bottom row of the card above, cut off at the top of the photo.
    [9,27,40,52,70].forEach((n,c)=>words.push(word(n,c,-1)));
    // A number from the card to the right, poking in at the edge.
    words.push(word(12,5,1));
    const {grid,flags}=wordsToCard(words);
    expect(grid).toEqual(PLAIN);
    expect(flags.flat().some(Boolean)).toBe(false);
  });
  it('leaves unreadable squares empty and flags low-confidence ones',()=>{
    const words=[];
    PLAIN.forEach((row,r)=>row.forEach((n,c)=>{if(n&&!(r===4&&c===4))words.push(word(n,c,r,r===0&&c===0?40:95))}));
    const {grid,flags}=wordsToCard(words);
    expect(grid[4][4]).toBeNull();
    expect(flags[4][4]).toBe(true);
    expect(flags[0][0]).toBe(true);
  });
});
