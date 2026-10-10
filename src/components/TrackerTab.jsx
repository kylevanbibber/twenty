import React,{useMemo,useRef,useState} from 'react';
import {letterFor} from '../data';
import {oneBallWinners,validCard,verifyPattern} from '../engine';
import {CardEditor} from './shared';

const callLabel=n=>`${letterFor(n)}-${n}`;

// Accepts "12", "B12", "b 12", "B-12".
function parseCall(text){
  const match=text.trim().toUpperCase().match(/^([BINGO])?\s*-?\s*(\d{1,2})$/);
  if(!match)return null;
  const n=Number(match[2]);
  if(n<1||n>75)return null;
  if(match[1]&&letterFor(n)!==match[1])return null;
  return n;
}

export function TrackerTab({game,results,patterns,mutate}){
  const [number,setNumber]=useState('');
  const [error,setError]=useState('');
  const [showPad,setShowPad]=useState(true);
  const [showHistory,setShowHistory]=useState(false);
  const inputRef=useRef(null);
  const isWildBall=n=>game.wildFives&&n%10===5;
  const current=results.find(r=>r.index===game.selected)||results[0];
  const nextBall=useMemo(()=>oneBallWinners(results),[results]);
  const last=game.called[game.called.length-1];

  const mark=n=>{
    if(!Number.isInteger(n)||n<1||n>75||isWildBall(n))return;
    mutate(g=>({...g,called:g.called.includes(n)?g.called.filter(v=>v!==n):[...g.called,n]}));
  };
  const submit=e=>{
    e.preventDefault();
    if(!number.trim())return;
    const n=parseCall(number);
    if(n===null){setError('Enter 1–75, optionally with its letter (e.g. B12).');return}
    if(isWildBall(n)){setError(`${callLabel(n)} is wild — already counted on every card.`);setNumber('');return}
    if(game.called.includes(n)){setError(`${callLabel(n)} is already marked. Tap it on the keypad to undo.`);setNumber('');return}
    setError('');mark(n);setNumber('');inputRef.current?.focus();
  };
  const select=index=>mutate(g=>({...g,selected:index}));

  return <>
    <section className="panel green"><strong>Wild numbers active: {game.wildFives?'5, 15, 25, 35, 45, 55, 65, 75':'None'}</strong><p>FREE center also counts automatically. {game.requiredPatterns===2?'Two distinct selected patterns on the same card win.':'One selected pattern wins.'}</p></section>

    <section className="panel call-panel">
      <div className="spread"><h2>Called balls</h2><button className="small ghost" onClick={()=>{if(confirm('Clear all called balls?'))mutate(g=>({...g,called:[]}))}}>Reset calls</button></div>
      {last&&<div className="last-call"><div><small>Last call</small><b>{callLabel(last)}</b></div><button className="ghost" onClick={()=>mutate(g=>({...g,called:g.called.slice(0,-1)}))}>Undo last</button></div>}
      <form className="number-form" onSubmit={submit}><input ref={inputRef} inputMode="numeric" enterKeyHint="done" autoComplete="off" placeholder="Enter 1–75 or B12" value={number} onChange={e=>{setNumber(e.target.value);setError('')}}/><button type="submit">Mark ball</button></form>
      {error&&<p className="error">{error}</p>}
      <div className="spread"><small>Tap a marked number to undo.</small><div className="button-row tight"><button className="small ghost" onClick={()=>setShowHistory(h=>!h)}>{showHistory?'Hide':'Show'} history</button><button className="small ghost" onClick={()=>setShowPad(p=>!p)}>{showPad?'Hide':'Show'} keypad</button></div></div>
      {showHistory&&<ol className="history">{game.called.length?game.called.map((n,i)=><li key={n}><span>#{i+1}</span>{callLabel(n)}</li>):<li className="muted">No balls called yet.</li>}</ol>}
      {showPad&&<div className="number-grid">{Array.from({length:75},(_,i)=>i+1).map(n=><button key={n} disabled={isWildBall(n)} onClick={()=>mark(n)} className={`${isWildBall(n)?'wild':''} ${game.called.includes(n)?'called':''}`}>{n}</button>)}</div>}
    </section>

    {nextBall.length>0&&<section className="panel next-ball"><h2>Wins on the next ball</h2><p className="muted">Calling any of these completes a bingo on at least one card.</p><div className="chips">{nextBall.map(({number:n,cards})=><button key={n} className="chip" onClick={()=>select(cards[0])}><b>{callLabel(n)}</b><small>card {cards.map(c=>c+1).join(', ')}</small></button>)}</div></section>}

    <section className="panel"><h2>Closest to {game.requiredPatterns===2?'double ':''}bingo</h2><p className="muted">Distance = unique numbers needed to finish {game.requiredPatterns===2?'any two enabled patterns':'any enabled pattern'}.</p><div className="rank-grid">{results.map(r=><button key={r.index} className={`rank ${r.index===game.selected?'selected':''} ${r.win?'won':''}`} onClick={()=>select(r.index)}><small>Card {r.index+1}{game.verified[r.index]?' ✓':''}</small><b>{r.win?'✓':r.best?.missing.length??'—'}</b><small>{r.win?'BINGO':r.best?'away':'No pair'}</small>{r.complete.length>0&&<em>{r.complete.length} done</em>}</button>)}</div></section>

    <CardView key={current?.index} current={current} game={game} patterns={patterns} mutate={mutate}/>
  </>;
}

function CardView({current,game,patterns,mutate}){
  const [editGrid,setEditGrid]=useState(null);
  if(!current)return null;
  const flat=current.numbers;
  const editing=editGrid!==null;
  const changeSelected=n=>{mutate(g=>({...g,selected:n}));setEditGrid(null)};
  const saveCard=()=>{
    if(!validCard(editGrid)){alert('Card needs 5 rows, 5 columns, values 1–75, and FREE center.');return}
    mutate(g=>({...g,cards:g.cards.map((c,i)=>i===current.index?editGrid:c),verified:g.verified.map((v,i)=>i===current.index?true:v)}));
    setEditGrid(null);
  };
  const sheet=current.index<9?'Sheet 1':current.index<18?'Sheet 2':'Added card';
  const verified=game.verified[current.index];
  const winningPatterns=current.win?current.complete.slice(0,game.requiredPatterns):[];
  return <section className="panel">
    <div className="spread"><div><h2>Card {current.index+1}</h2><small>{sheet} · {current.complete.length} completed patterns · {verified?'✓ verified':'not verified'}</small></div><span className={current.win?'badge win':'badge'}>{current.win?(game.requiredPatterns===2?'DOUBLE BINGO':'BINGO'):current.best?`${current.best.missing.length} needed`:'No pair'}</span></div>
    {editing?<CardEditor grid={editGrid} onChange={setEditGrid}/>:
    <div className="card-grid">{'BINGO'.split('').map((h,i)=><div key={i} className="card-head">{h}</div>)}{flat.map((n,i)=>{const wild=n===0||game.wildFives&&n%10===5;const picked=game.called.includes(n);const relevant=current.best?.cells.includes(i);return <div key={i} className={`square ${wild?'is-wild':''} ${!wild&&picked?'is-called':''} ${relevant?'relevant':''}`}>{n===0?'★':n}</div>})}</div>}
    {current.best&&!editing&&<div className="summary">{current.win?<><strong>🎉 {game.requiredPatterns===2?'Two patterns':'Pattern'} completed — verify on paper!</strong>
      {winningPatterns.map(pattern=><div key={pattern.id} className="verify"><p><b>{pattern.name}</b></p><div className="verify-cells">{verifyPattern(flat,patterns.find(p=>p.id===pattern.id),game.called,game.wildFives).map(cell=><span key={cell.cell} className={cell.reason}>{cell.number===0?'FREE':`${'BINGO'[cell.cell%5]}-${cell.number}`}<small>{cell.reason==='called'?`call #${cell.callOrder}`:cell.reason}</small></span>)}</div></div>)}
    </>:<><strong>Closest combination</strong><p>{current.best.names.join(' + ')}</p><p>Need: <b>{current.best.missing.slice().sort((a,b)=>a-b).join(', ')||'None'}</b></p></>}</div>}
    <div className="button-row"><button className="ghost" disabled={current.index===0} onClick={()=>changeSelected(current.index-1)}>← Previous</button><button className="ghost" disabled={current.index===game.cards.length-1} onClick={()=>changeSelected(current.index+1)}>Next →</button></div>
    <div className="button-row">{editing?<><button onClick={saveCard}>Save card corrections</button><button className="ghost" onClick={()=>setEditGrid(null)}>Cancel</button></>:<><button className="ghost" onClick={()=>setEditGrid(game.cards[current.index].map(r=>r.slice()))}>Correct card numbers</button><button className={verified?'ghost':''} onClick={()=>mutate(g=>({...g,verified:g.verified.map((v,i)=>i===current.index?!v:v)}))}>{verified?'Mark unverified':'Matches paper ✓'}</button></>}</div>
  </section>;
}
