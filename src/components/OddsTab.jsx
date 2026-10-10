import React,{useEffect,useRef,useState} from 'react';

const fmt=p=>p>=0.9995?'100%':p<0.0005&&p>0?'<0.1%':(100*p).toFixed(1)+'%';

// Runs the Monte Carlo in a Web Worker, debounced, ignoring stale responses.
function useOdds(input){
  const [state,setState]=useState({result:null,error:null,running:true});
  const worker=useRef(null);
  const latest=useRef(0);
  const key=JSON.stringify(input);
  useEffect(()=>{
    const w=new Worker(new URL('../odds.worker.js',import.meta.url),{type:'module'});
    w.onmessage=e=>{if(e.data.requestId===latest.current)setState({result:e.data.result??null,error:e.data.error??null,running:false})};
    worker.current=w;
    return ()=>w.terminate();
  },[]);
  useEffect(()=>{
    const requestId=++latest.current;
    setState(s=>({...s,running:true}));
    const timer=setTimeout(()=>worker.current?.postMessage({requestId,input:JSON.parse(key)}),200);
    return ()=>clearTimeout(timer);
  },[key]);
  return state;
}

export function OddsTab({game,patterns}){
  const [horizon,setHorizon]=useState(5);
  const [wildsDrawn,setWildsDrawn]=useState(false);
  const [opponents,setOpponents]=useState(0);
  const enabled=patterns.filter(p=>game.enabledIds.includes(p.id)).map(({id,cells})=>({id,cells}));
  const {result,error,running}=useOdds({cards:game.cards,patterns:enabled,called:game.called,wildFives:game.wildFives,required:game.requiredPatterns,wildsDrawn:game.wildFives&&wildsDrawn,opponents,trials:opponents>500?600:opponents>0?1200:3000});
  const horizonIndex=result?.horizons.findIndex(h=>h.calls===horizon)??-1;
  const selected=result?.horizons[horizonIndex];
  const topCards=result?result.perCard.slice().sort((a,b)=>b.horizons[horizonIndex]-a.horizons[horizonIndex]).slice(0,6):[];
  const enough=enabled.length>=game.requiredPatterns;
  const curve=result?.curve.slice(0,Math.min(41,result.curve.length))??[];

  return <>
    <section className="panel">
      <h2>Chance of a {game.requiredPatterns===2?'double ':''}bingo {running&&<small className="muted">· updating…</small>}</h2>
      <p className="muted">Probability that one or more of your {game.cards.length} cards wins within the next calls, assuming the remaining balls come out uniformly at random.</p>
      {!enough&&<p className="error">Enable at least {game.requiredPatterns} pattern{game.requiredPatterns>1?'s':''} on the Patterns tab.</p>}
      {error&&<p className="error">{error}</p>}
      <div className="horizons">{(result?.horizons??[]).map(h=><button className={horizon===h.calls?'active':''} onClick={()=>setHorizon(h.calls)} key={h.calls}>Next {h.calls}<small>{fmt(h.probability)}</small></button>)}</div>
      {selected&&<><div className="big-percent">{fmt(selected.probability)}</div><div className="progress"><div style={{width:`${selected.probability*100}%`}}/></div>
      <small>±{(selected.margin*100).toFixed(1)} points (95% range) from {result.trials.toLocaleString()} simulated games. {result.remaining} eligible uncalled balls remain{game.wildFives&&!wildsDrawn?', excluding wild 5s':''}.</small></>}
      {result&&<p className="stat-line">{result.medianCalls===0?<b>You already have a bingo — verify it on the Tracker tab.</b>:result.medianCalls!==null?<>Half of simulated games reach your bingo within <b>{result.medianCalls}</b> more call{result.medianCalls===1?'':'s'}.</>:'Most simulated games never reach a bingo with these patterns.'}</p>}
      {curve.length>1&&<div className="curve" role="img" aria-label="Chance of bingo by number of further calls">{curve.slice(1).map((p,i)=><span key={i} style={{height:`${Math.max(2,p*100)}%`}} className={i+1<=horizon?'in':''} title={`${i+1} calls: ${fmt(p)}`}/>)}</div>}
      {curve.length>1&&<div className="spread curve-axis"><small>1 call</small><small>{curve.length-1} calls</small></div>}
      {game.wildFives&&<label className="toggle"><input type="checkbox" checked={wildsDrawn} onChange={e=>setWildsDrawn(e.target.checked)}/><span>Wild 5 balls are still drawn and announced (they use up calls without marking anything new)</span></label>}
    </section>

    {result&&<section className="panel"><h2>Best cards within next {horizon}</h2><table className="odds-table"><thead><tr><th>Card</th><th>Chance</th><th>Avg. calls to win</th></tr></thead><tbody>{topCards.map(c=><tr key={c.index}><td>Card {c.index+1}</td><td>{fmt(c.horizons[horizonIndex])}</td><td>{c.averageCalls===null?'—':c.averageCalls.toFixed(1)}</td></tr>)}</tbody></table></section>}

    <section className="panel">
      <h2>Other cards in the hall</h2>
      <label>Estimated opposing cards: <b>{opponents}</b></label>
      <input type="range" min="0" max="2000" step="25" value={opponents} onChange={e=>setOpponents(Number(e.target.value))}/>
      {result?.competition?<div className="competition"><div><b>{fmt(result.competition.first)}</b><small>you bingo first</small></div><div><b>{fmt(result.competition.tie)}</b><small>tie on same ball</small></div><div><b>{fmt(result.competition.beaten)}</b><small>someone else first</small></div></div>:null}
      <p className="muted">Model, not a prediction: opposing cards are simulated as random standard cards (B 1–15 … O 61–75) playing the same patterns and wild rules, with the balls already called. Real opponents' cards and how many are actually in play are unknown, so treat this as a rough guide.</p>
    </section>
  </>;
}
