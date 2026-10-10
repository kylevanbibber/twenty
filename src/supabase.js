import {createClient} from '@supabase/supabase-js';
import {normalizeGame} from './data';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key):null;

const TABLE='bingo_games';

export async function listCloudGames(){
  const {data,error}=await supabase.from(TABLE).select('id,name,game,updated_at').order('updated_at',{ascending:false});
  if(error)throw error;
  return data.map(row=>normalizeGame({...row.game,id:row.id,name:row.name,updatedAt:row.game?.updatedAt??row.updated_at}));
}

export async function saveCloudGame(userId,game){
  const {error}=await supabase.from(TABLE).upsert({id:game.id,user_id:userId,name:game.name,game,updated_at:game.updatedAt},{onConflict:'id'});
  if(error)throw error;
}

export async function deleteCloudGame(id){
  const {error}=await supabase.from(TABLE).delete().eq('id',id);
  if(error)throw error;
}

// Per-game last-write-wins by updatedAt. Returns the merged games and how many came from the cloud.
export function mergeGames(localGames,cloudGames){
  const merged={...localGames};
  let pulled=0;
  for(const game of cloudGames){
    const local=merged[game.id];
    if(!local||new Date(game.updatedAt)>new Date(local.updatedAt)){merged[game.id]=game;pulled++}
  }
  return {games:merged,pulled};
}
