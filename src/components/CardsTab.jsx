import React,{useRef,useState} from 'react';
import {cardIssues,validCard} from '../engine';
import {CardEditor} from './shared';

const LAYOUTS=[[1,1,'1 card'],[1,2,'1 × 2'],[2,2,'2 × 2'],[2,3,'2 rows × 3'],[3,2,'3 rows × 2'],[3,3,'3 × 3 (9-up sheet)']];
const blankGrid=()=>Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r===2&&c===2?0:null));

export function CardsTab({game,mutate,openCard}){
  const [layout,setLayout]=useState(0);
  const [status,setStatus]=useState('');
  const [scanned,setScanned]=useState([]);
  const cameraInput=useRef(null);
  const fileInput=useRef(null);
  const [rows,columns]=LAYOUTS[layout];

  const scan=async e=>{
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file)return;
    try{
      const {scanSheet}=await import('../scan');
      const cards=await scanSheet(file,{rows,columns,onProgress:setStatus});
      setScanned(list=>[...list,...cards.map(card=>({...card,key:crypto.randomUUID(),target:'new'}))]);
      setStatus(`Read ${cards.length} card${cards.length===1?'':'s'}. Check every number below before adding.`);
    }catch(error){setStatus(`Scan failed: ${error.message}. You can still enter the card by hand.`)}
  };
  const updateScanned=(key,patch)=>setScanned(list=>list.map(s=>s.key===key?{...s,...patch}:s));
  const accept=item=>{
    if(!validCard(item.grid)){alert('Fill every square with a number from 1–75 first.');return}
    if(item.target==='new'){
      mutate(g=>({...g,cards:[...g.cards,item.grid],verified:[...g.verified,true]}));
    }else{
      const index=Number(item.target);
      if(!confirm(`Replace card ${index+1} with this scan?`))return;
      mutate(g=>({...g,cards:g.cards.map((c,i)=>i===index?item.grid:c),verified:g.verified.map((v,i)=>i===index?true:v)}));
    }
    setScanned(list=>list.filter(s=>s.key!==item.key));
  };
  const removeCard=index=>{
    if(!confirm(`Remove card ${index+1} from this game? Other cards will be renumbered.`))return;
    mutate(g=>({...g,cards:g.cards.filter((_,i)=>i!==index),verified:g.verified.filter((_,i)=>i!==index),selected:0}));
  };
  const unverified=game.verified.filter(v=>!v).length;

  return <>
    <section className="panel">
      <h2>Scan bingo cards</h2>
      <p className="muted">Take a flat, well-lit photo straight on. For a full sheet, pick its layout so each card is read separately. Scanning runs on your phone; the photo isn't uploaded.</p>
      <label>Sheet layout<select value={layout} onChange={e=>setLayout(Number(e.target.value))}>{LAYOUTS.map(([r,c,name],i)=><option key={i} value={i}>{name}</option>)}</select></label>
      <div className="button-row"><button onClick={()=>cameraInput.current?.click()}>📷 Take photo</button><button className="ghost" onClick={()=>fileInput.current?.click()}>Choose photo</button><button className="ghost" onClick={()=>setScanned(list=>[...list,{key:crypto.randomUUID(),grid:blankGrid(),flags:null,target:'new'}])}>Type a card</button></div>
      <input hidden ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={scan}/>
      <input hidden ref={fileInput} type="file" accept="image/*" onChange={scan}/>
      {status&&<p className="status">{status}</p>}
    </section>

    {scanned.map((item,i)=><section key={item.key} className="panel scanned">
      <div className="spread"><h2>Review card {i+1}</h2><button className="small ghost" onClick={()=>setScanned(list=>list.filter(s=>s.key!==item.key))}>Discard</button></div>
      {item.preview&&<img className="scan-preview" src={item.preview} alt="Scanned card"/>}
      <CardEditor grid={item.grid} flags={item.flags} onChange={grid=>updateScanned(item.key,{grid})}/>
      <label>Save as<select value={item.target} onChange={e=>updateScanned(item.key,{target:e.target.value})}><option value="new">New card {game.cards.length+1}</option>{game.cards.map((_,index)=><option key={index} value={index}>Replace card {index+1}</option>)}</select></label>
      <div className="button-row"><button disabled={!validCard(item.grid)} onClick={()=>accept(item)}>I checked it — save card</button></div>
    </section>)}

    <section className="panel">
      <div className="spread"><h2>Your cards</h2><small>{unverified?`${unverified} not verified`:'All verified ✓'}</small></div>
      <p className="muted">Mark each card verified once you've compared it to the paper. Open a card to correct numbers.</p>
      <div className="card-list">{game.cards.map((card,index)=>{const issues=cardIssues(card);return <div key={index} className="card-row">
        <button className="link" onClick={()=>openCard(index)}><b>Card {index+1}</b><small>{card[0].join(' · ')} …</small></button>
        <span className={`pill ${issues.length?'warn':''}`}>{issues.length?`${issues.length} to check`:'layout OK'}</span>
        <label className="verify-check"><input type="checkbox" checked={game.verified[index]} onChange={()=>mutate(g=>({...g,verified:g.verified.map((v,i)=>i===index?!v:v)}))}/>Verified</label>
        <button className="small ghost" onClick={()=>removeCard(index)} aria-label={`Remove card ${index+1}`}>✕</button>
      </div>})}</div>
    </section>
  </>;
}
