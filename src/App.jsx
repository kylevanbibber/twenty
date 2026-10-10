import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {gamePatterns,initialGame,normalizeGame} from './data';
import {cardResults} from './engine';
import {supabase,listCloudGames,saveCloudGame,deleteCloudGame,mergeGames} from './supabase';
import {loadLibrary,saveLibrary} from './storage';
import {TrackerTab} from './components/TrackerTab';
import {OddsTab} from './components/OddsTab';
import {PatternsTab} from './components/PatternsTab';
import {CardsTab} from './components/CardsTab';
import {GamesTab} from './components/GamesTab';

const TABS=[['tracker','Tracker'],['odds','Odds'],['patterns','Patterns'],['cards','Cards'],['games','Games']];

export default function App(){
  const [library,setLibrary]=useState(loadLibrary);
  const [session,setSession]=useState(null);
  const [sync,setSync]=useState('Saved on this device');
  const [cloudReady,setCloudReady]=useState(false);
  const [tab,setTab]=useState('tracker');
  const [winAlert,setWinAlert]=useState(null);
  const uploadTimer=useRef(null);
  const game=library.games[library.activeId];
  const libraryRef=useRef(library);
  libraryRef.current=library;

  const mutate=useCallback(fn=>setLibrary(lib=>{
    const current=lib.games[lib.activeId];
    return {...lib,games:{...lib.games,[lib.activeId]:{...fn(current),updatedAt:new Date().toISOString()}}};
  }),[]);
  const addGame=useCallback(newGame=>setLibrary(lib=>({activeId:newGame.id,games:{...lib.games,[newGame.id]:normalizeGame(newGame)}})),[]);
  const openGame=useCallback(id=>setLibrary(lib=>lib.games[id]?{...lib,activeId:id}:lib),[]);
  const removeGame=useCallback(id=>{
    setLibrary(lib=>{
      const games={...lib.games};delete games[id];
      if(!Object.keys(games).length){const fresh=initialGame();games[fresh.id]=fresh}
      return {activeId:games[lib.activeId]?lib.activeId:Object.keys(games)[0],games};
    });
    if(supabase&&session?.user)deleteCloudGame(id).catch(error=>setSync(`Cloud delete error: ${error.message}`));
  },[session]);

  useEffect(()=>saveLibrary(library),[library]);

  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  // On sign-in, pull every cloud game and keep the newest copy of each, so a second device
  // picks up saved games without overwriting them with its own stale local copy.
  const pullCloud=useCallback(async()=>{
    if(!supabase||!session?.user)return;
    setSync('Loading cloud games…');
    try{
      const cloudGames=await listCloudGames();
      let pulled=0;
      setLibrary(lib=>{const merged=mergeGames(lib.games,cloudGames);pulled=merged.pulled;return {...lib,games:merged.games}});
      const cloudIds=new Set(cloudGames.map(g=>g.id));
      const cloudById=Object.fromEntries(cloudGames.map(g=>[g.id,g]));
      const local=Object.values(libraryRef.current.games).filter(g=>!cloudIds.has(g.id)||new Date(g.updatedAt)>new Date(cloudById[g.id].updatedAt));
      await Promise.all(local.map(g=>saveCloudGame(session.user.id,g)));
      setSync(`Synced · ${cloudGames.length} cloud game${cloudGames.length===1?'':'s'}${pulled?`, ${pulled} updated from cloud`:''}`);
      setCloudReady(true);
    }catch(error){setSync(`Cloud sync error: ${error.message}`)}
  },[session]);

  useEffect(()=>{setCloudReady(false);pullCloud()},[pullCloud]);

  useEffect(()=>{
    if(!supabase||!session?.user||!cloudReady)return;
    setSync('Syncing…');
    clearTimeout(uploadTimer.current);
    uploadTimer.current=setTimeout(()=>{
      saveCloudGame(session.user.id,game).then(()=>setSync('Synced to cloud'),error=>setSync(`Cloud sync error: ${error.message}`));
    },900);
    return ()=>clearTimeout(uploadTimer.current);
  },[game,session,cloudReady]);

  const patterns=useMemo(()=>gamePatterns(game),[game.customPatterns]);
  const results=useMemo(()=>cardResults(game.cards,game.called,game.enabledIds,game.wildFives,game.requiredPatterns,patterns),[game.cards,game.called,game.enabledIds,game.wildFives,game.requiredPatterns,patterns]);
  const winners=results.filter(r=>r.win);

  // Alert once per newly winning card, not on every render while it stays a winner.
  const announced=useRef(new Set(winners.map(r=>`${game.id}:${r.index}`)));
  useEffect(()=>{
    const fresh=winners.filter(r=>!announced.current.has(`${game.id}:${r.index}`));
    winners.forEach(r=>announced.current.add(`${game.id}:${r.index}`));
    if(fresh.length){setWinAlert(fresh.map(r=>r.index));navigator.vibrate?.([200,100,200,100,400])}
  },[winners,game.id]);

  const label=game.requiredPatterns===2?'Double-pattern bingo':'Single-pattern bingo';
  return <div className="app">
    <header><div><h1>🎱 Bingo Buddy</h1><p>{label} · {game.wildFives?'Wild 5s':'No wilds'} · {game.cards.length} cards</p></div><span className={winners.length?'badge win':'badge'}>{winners.length?'BINGO!':'Live game'}</span></header>
    {winAlert&&<button className="win-alert" onClick={()=>{setTab('tracker');mutate(g=>({...g,selected:winAlert[0]}));setWinAlert(null)}}>🎉 BINGO on card {winAlert.map(i=>i+1).join(', ')} — tap to verify</button>}
    <nav>{TABS.map(([id,name])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{name}</button>)}</nav>
    <section className="metrics"><div><strong>{game.cards.length}</strong><small>Cards</small></div><div><strong>{game.called.length}</strong><small>Called</small></div><div><strong>{winners.length}</strong><small>Winners</small></div></section>
    {tab==='tracker'&&<TrackerTab game={game} results={results} patterns={patterns} mutate={mutate}/>}
    {tab==='odds'&&<OddsTab game={game} patterns={patterns}/>}
    {tab==='patterns'&&<PatternsTab game={game} patterns={patterns} mutate={mutate}/>}
    {tab==='cards'&&<CardsTab game={game} mutate={mutate} openCard={index=>{mutate(g=>({...g,selected:index}));setTab('tracker')}}/>}
    {tab==='games'&&<GamesTab library={library} game={game} mutate={mutate} addGame={addGame} openGame={id=>{openGame(id);setTab('tracker')}} removeGame={removeGame} session={session} sync={sync} pullCloud={pullCloud}/>}
    <footer>Numbers were transcribed from photos or scanned. Confirm cards, wildcard rules, and acceptable patterns with the paper sheets and bingo hall. Check your hall's electronic-assistance rules before live use.</footer>
  </div>;
}
