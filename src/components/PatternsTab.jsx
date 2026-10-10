import React,{useState} from 'react';
import {PATTERNS} from '../data';
import {PatternPreview} from './shared';

export function PatternsTab({game,patterns,mutate}){
  const [draft,setDraft]=useState(null);
  const togglePattern=id=>mutate(g=>({...g,enabledIds:g.enabledIds.includes(id)?g.enabledIds.filter(x=>x!==id):[...g.enabledIds,id]}));
  const toggleCell=i=>setDraft(d=>({...d,cells:d.cells.includes(i)?d.cells.filter(c=>c!==i):[...d.cells,i].sort((a,b)=>a-b)}));
  const saveDraft=()=>{
    const name=draft.name.trim();
    if(!name||draft.cells.length===0){alert('Give the pattern a name and tap at least one square.');return}
    const pattern={id:draft.id??`custom-${crypto.randomUUID()}`,name,cells:draft.cells,custom:true};
    mutate(g=>({...g,customPatterns:draft.id?g.customPatterns.map(p=>p.id===draft.id?pattern:p):[...g.customPatterns,pattern],enabledIds:g.enabledIds.includes(pattern.id)?g.enabledIds:[...g.enabledIds,pattern.id]}));
    setDraft(null);
  };
  const removeCustom=id=>{if(confirm('Delete this custom pattern?'))mutate(g=>({...g,customPatterns:g.customPatterns.filter(p=>p.id!==id),enabledIds:g.enabledIds.filter(x=>x!==id)}))};
  const enabledCount=patterns.filter(p=>game.enabledIds.includes(p.id)).length;

  return <>
    <section className="panel">
      <h2>Game rules</h2>
      <div className="segmented"><button className={game.requiredPatterns===2?'active':''} onClick={()=>mutate(g=>({...g,requiredPatterns:2}))}>Double bingo (2 patterns)</button><button className={game.requiredPatterns===1?'active':''} onClick={()=>mutate(g=>({...g,requiredPatterns:1}))}>Single bingo</button></div>
      <label className="toggle"><input type="checkbox" checked={game.wildFives} onChange={e=>mutate(g=>({...g,wildFives:e.target.checked}))}/><span>Numbers ending in 5 are wild (5, 15 … 75)</span></label>
    </section>

    <section className="panel">
      <div className="spread"><h2>Custom patterns</h2>{!draft&&<button className="small" onClick={()=>setDraft({name:'',cells:[12]})}>+ New pattern</button>}</div>
      {draft&&<div className="pattern-editor">
        <label>Pattern name<input value={draft.name} placeholder="e.g. Letter T" onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
        <p className="muted">Tap squares to include them. The center is the FREE square.</p>
        <div className="draw-grid">{Array.from({length:25},(_,i)=><button key={i} type="button" aria-pressed={draft.cells.includes(i)} className={draft.cells.includes(i)?'on':''} onClick={()=>toggleCell(i)}>{i===12?'★':''}</button>)}</div>
        <div className="button-row"><button onClick={saveDraft}>Save pattern</button><button className="ghost" onClick={()=>setDraft(d=>({...d,cells:[]}))}>Clear</button><button className="ghost" onClick={()=>setDraft(null)}>Cancel</button></div>
      </div>}
      {game.customPatterns.length===0&&!draft&&<p className="muted">Draw any shape your hall plays (letters, crazy patterns, specialty orientations). Custom patterns are saved with this game.</p>}
      <div className="checks">{game.customPatterns.map(p=><div key={p.id} className="pattern-option"><label><input type="checkbox" checked={game.enabledIds.includes(p.id)} onChange={()=>togglePattern(p.id)}/><PatternPreview cells={p.cells}/><span>{p.name}</span></label><span className="button-row tight"><button className="small ghost" onClick={()=>setDraft({id:p.id,name:p.name,cells:p.cells})}>Edit</button><button className="small ghost" onClick={()=>removeCustom(p.id)}>Delete</button></span></div>)}</div>
    </section>

    <section className="panel">
      <h2>Allowed patterns</h2>
      <p className="muted">Choose exactly which patterns are valid at your hall. {game.requiredPatterns===2?'Two distinct completed patterns on one card trigger Bingo.':'Any one completed pattern triggers Bingo.'} Specialty patterns should be checked against the printed handout before live play.</p>
      <div className="button-row"><button className="small ghost" onClick={()=>mutate(g=>({...g,enabledIds:patterns.map(p=>p.id)}))}>Select all</button><button className="small ghost" onClick={()=>mutate(g=>({...g,enabledIds:[]}))}>Clear all</button></div>
      <div className="checks">{PATTERNS.map(p=><label key={p.id} className="pattern-option"><input type="checkbox" checked={game.enabledIds.includes(p.id)} onChange={()=>togglePattern(p.id)}/><PatternPreview cells={p.cells}/><span>{p.name}</span></label>)}</div>
      <p className="muted">{enabledCount} enabled patterns. The top-left postage stamp and other orientations are separate selectable patterns.</p>
    </section>
  </>;
}
