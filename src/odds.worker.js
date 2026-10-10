import {simulateOdds} from './odds';

self.onmessage=event=>{
  const {requestId,input}=event.data;
  try{self.postMessage({requestId,result:simulateOdds(input)})}
  catch(error){self.postMessage({requestId,error:error.message})}
};
