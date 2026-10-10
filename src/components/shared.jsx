import React from 'react';
import {cardIssues} from '../engine';

export function PatternPreview({cells,size='small'}){
  const set=new Set(cells);
  return <div className={`pattern-preview ${size}`} aria-hidden="true">{Array.from({length:25},(_,i)=><span key={i} className={set.has(i)?'on':''}/>)}</div>;
}

// Editable 5x5 grid. `flags` marks cells the scanner was unsure about; issues come from
// standard column ranges and duplicates. Both are hints for manual checking only.
export function CardEditor({grid,flags,onChange}){
  const issues=cardIssues(grid).filter(issue=>grid[Math.floor(issue.cell/5)][issue.cell%5]!==null);
  const empty=grid.flat().filter((n,i)=>i!==12&&n===null).length;
  const issueCells=new Set(issues.map(i=>i.cell));
  const setCell=(index,value)=>{
    const next=grid.map(row=>row.slice());
    next[Math.floor(index/5)][index%5]=value.trim()===''?null:Number(value);
    onChange(next);
  };
  return <>
    <div className="card-grid editor">
      {'BINGO'.split('').map((h,i)=><div key={i} className="card-head">{h}</div>)}
      {grid.flat().map((n,i)=><div key={i} className={`square ${flags?.[Math.floor(i/5)]?.[i%5]?'flagged':''} ${issueCells.has(i)?'has-issue':''}`}>
        {i===12?'★':<input aria-label={`Row ${Math.floor(i/5)+1} column ${'BINGO'[i%5]}`} type="number" inputMode="numeric" min="1" max="75" value={n??''} onChange={e=>setCell(i,e.target.value)}/>}
      </div>)}
    </div>
    {empty>0&&<p className="muted">{empty} square{empty===1?'':'s'} still empty.</p>}
    {issues.length>0&&<ul className="issues">{issues.map((issue,i)=><li key={i}>{issue.message}</li>)}</ul>}
    {flags?.flat().some(Boolean)&&<p className="muted">Yellow squares were hard to read. Check them against the paper card.</p>}
  </>;
}
