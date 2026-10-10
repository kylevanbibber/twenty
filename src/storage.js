import {initialGame,normalizeGame} from './data';

const LEGACY_KEY='bingo-buddy-game-v1';
const KEY='bingo-buddy-games-v2';

// Local library of games: {activeId, games: {[id]: game}}. Migrates the single v1 save.
export function loadLibrary(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(saved?.games&&Object.keys(saved.games).length){
      const games=Object.fromEntries(Object.entries(saved.games).map(([id,g])=>[id,normalizeGame(g)]));
      return {activeId:games[saved.activeId]?saved.activeId:Object.keys(games)[0],games};
    }
  }catch{}
  let first;
  try{
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY));
    if(legacy?.cards&&Array.isArray(legacy.called))first=normalizeGame(legacy);
  }catch{}
  first??=initialGame();
  return {activeId:first.id,games:{[first.id]:first}};
}

export function saveLibrary(library){
  try{localStorage.setItem(KEY,JSON.stringify(library))}catch{}
}
