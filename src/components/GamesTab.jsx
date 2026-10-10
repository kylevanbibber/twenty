import React,{useRef,useState} from 'react';
import {initialGame,normalizeGame} from '../data';
import {validCard} from '../engine';
import {supabase} from '../supabase';

const when=iso=>new Date(iso).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});

export function GamesTab({library,game,mutate,addGame,openGame,removeGame,session,sync,pullCloud}){
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [codeSent,setCodeSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const fileInput=useRef(null);
  const games=Object.values(library.games).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));

  const newRound=()=>addGame({...structuredClone(game),id:crypto.randomUUID(),name:`${game.name.replace(/ · round \d+$/,'')} · round ${games.length+1}`,called:[],selected:0,updatedAt:new Date().toISOString()});
  const duplicate=()=>addGame({...structuredClone(game),id:crypto.randomUUID(),name:`${game.name} (copy)`,updatedAt:new Date().toISOString()});
  const download=()=>{const blob=new Blob([JSON.stringify(game,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`bingo-buddy-${game.id}.json`;a.click();URL.revokeObjectURL(u)};
  const upload=async e=>{
    const f=e.target.files?.[0];if(!f)return;
    try{
      const data=JSON.parse(await f.text());
      if(!Array.isArray(data.cards)||!data.cards.every(validCard)||!Array.isArray(data.called)||!Array.isArray(data.enabledIds))throw Error('Invalid Bingo Buddy backup');
      addGame(normalizeGame({...data,id:crypto.randomUUID(),name:`${data.name??'Imported game'} (imported)`,updatedAt:new Date().toISOString()}));
    }catch(ex){alert(ex.message)}finally{e.target.value=''}
  };
  const sendLink=async()=>{
    setBusy(true);
    const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin+window.location.pathname}});
    setBusy(false);
    if(error){alert(error.message);return}
    setCodeSent(true);
  };
  // The emailed code lets you sign in inside an installed home-screen app, where tapping the
  // link would open a different browser instead.
  const verifyCode=async()=>{
    setBusy(true);
    const {error}=await supabase.auth.verifyOtp({email:email.trim(),token:code.trim(),type:'email'});
    setBusy(false);
    if(error)alert(error.message);
  };

  return <>
    <section className="panel">
      <h2>Current game</h2>
      <label>Game name<input value={game.name} onChange={e=>mutate(g=>({...g,name:e.target.value}))}/></label>
      <p className="muted">{sync}</p>
      <div className="button-row"><button onClick={newRound}>New round (same cards, clear calls)</button><button className="ghost" onClick={duplicate}>Duplicate</button></div>
    </section>

    <section className="panel">
      <div className="spread"><h2>Saved games</h2><button className="small ghost" onClick={()=>addGame(initialGame({name:'New game — original 18 cards'}))}>+ Original 18 cards</button></div>
      <div className="game-list">{games.map(g=><div key={g.id} className={`game-row ${g.id===game.id?'current':''}`}>
        <button className="link" onClick={()=>openGame(g.id)}><b>{g.name}</b><small>{g.cards.length} cards · {g.called.length} called · {when(g.updatedAt)}</small></button>
        {g.id===game.id?<span className="pill">Open</span>:<button className="small ghost" onClick={()=>{if(confirm(`Delete "${g.name}"${session?.user?' from this device and the cloud':''}?`))removeGame(g.id)}}>Delete</button>}
      </div>)}</div>
    </section>

    <section className="panel">
      <h2>Cloud sync {supabase?'enabled':'not configured'}</h2>
      {!supabase?<p>To sync across phones/computers, add your Supabase project URL and publishable/anon key to your hosting environment. Follow README.md and supabase/schema.sql.</p>
      :session?.user?<><p>Signed in as {session.user.email}</p><p className="muted">{sync}</p><div className="button-row"><button onClick={pullCloud}>Sync now</button><button className="ghost" onClick={()=>supabase.auth.signOut()}>Sign out</button></div><p className="muted">All your games sync automatically. Each game keeps whichever copy was changed most recently.</p></>
      :<><p>Sign in by email to save your games to your private account and open them on any device.</p>
        <div className="number-form"><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button disabled={busy||!email.includes('@')} onClick={sendLink}>{busy&&!codeSent?'Sending…':codeSent?'Resend':'Email sign-in link'}</button></div>
        {codeSent&&<><p className="muted">Check your email. Tap the link, or type the code from the email here:</p><div className="number-form"><input inputMode="numeric" autoComplete="one-time-code" placeholder="Code from email" value={code} onChange={e=>setCode(e.target.value)}/><button disabled={busy||code.trim().length<6} onClick={verifyCode}>Sign in</button></div></>}
      </>}
    </section>

    <section className="panel">
      <h2>Backups</h2>
      <div className="button-row"><button onClick={download}>Export JSON backup</button><button className="ghost" onClick={()=>fileInput.current?.click()}>Import backup</button><input hidden ref={fileInput} type="file" accept="application/json,.json" onChange={upload}/></div>
      <p className="muted">Import adds the backup as a new saved game.</p>
    </section>

    <section className="panel danger"><h2>Start fresh</h2><button className="danger-button" onClick={()=>{if(confirm('Replace this game’s cards with the original 18 demo cards and clear all calls? Export a backup first.'))mutate(g=>initialGame({id:g.id,name:g.name}))}}>Reset this game to original 18 cards</button></section>
  </>;
}
