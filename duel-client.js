(function(root){
 'use strict';
 function createClient({rpc,send,onRoom=()=>{},onError=()=>{},save=()=>{},schedule=setTimeout,cancel=clearTimeout}){
  let session=null,room=null,timer=null,generation=0,started=false,command=null,frame=null,outcome=null,working=false,pendingPlayed=null,playingLocal=false;
  const state=()=>({session,room,command});
  function apply(next){
   if(room?.code===next.code&&Number.isFinite(next.version)&&next.version<room.version)return;
   room=next;onRoom(room);onError(null);
   if(room.status==='abandoned'){stop();return;}
   if(!['playing','finished'].includes(room.status))return;
   if(!started){send('StartOnline',JSON.stringify({seat:room.seat,state:room.state}));started=true;}
   if(room.command){
    if(command!==room.command.id){command=room.command.id;frame=outcome=null;playingLocal=room.seat===1;send('OnlineAck',JSON.stringify(room.state));send('OnlineCommand',JSON.stringify(room.command));}
   }else send('OnlineAck',JSON.stringify(room.state));
   if(room.status==='finished'&&!playingLocal&&!pendingPlayed)stop();
  }
  function stop(){generation++;if(timer)cancel(timer);timer=null;}
  async function call(action,data={}){return rpc(action,session.token,session.code,data);}
  async function tick(){
   if(!session)return;if(working){timer=schedule(tick,250);return;}const gen=generation;working=true;
   try{
    let next;
    if(pendingPlayed){const id=pendingPlayed;next=await call('played',{id});if(pendingPlayed===id)pendingPlayed=null;}
    else if(outcome&&command){const report=outcome;next=await call('resolve',{...report,id:command});if(outcome===report)outcome=null;}
    else if(frame&&command){const report=frame;frame=null;next=await call('frame',{...report,id:command});}
    else next=await call('read');
    if(gen===generation)apply(next);
   }catch(e){if(gen===generation){if(e.message==='stale_command'){frame=outcome=pendingPlayed=null;}onError(e);}}
   finally{working=false;if(gen===generation&&session&&room?.status!=='abandoned')timer=schedule(tick,room?.state?.flying?200:500);}
  }
  return {
   state,
   async start(action,token,code=null){
    stop();const gen=generation;started=false;command=frame=outcome=pendingPlayed=null;playingLocal=false;
    const next=await rpc(action,token,code,{});if(gen!==generation)return;
    session={code:next.code,token};save(session);apply(next);if(playingLocal||pendingPlayed||!["finished","abandoned"].includes(next.status))timer=schedule(tick,250);return next;
   },
   async action(kind,value,turn){
    if(!session)return;const gen=generation;
    try{const next=await call('act',{kind,value,turn});if(gen===generation)apply(next);}
    catch(e){if(gen===generation){send('OnlineError','');onError(e);}}
   },
   played(){if(command&&session){playingLocal=false;pendingPlayed=command;}},
   frame(data){if(command&&!outcome)frame=data;},
   outcome(data){if(command){outcome=data;frame=null;}},
   async leave(){const old=session;stop();session=null;room=null;started=false;command=frame=outcome=pendingPlayed=null;playingLocal=false;save(null);if(old)try{await rpc('leave',old.token,old.code,{});}catch{}},
   tick,stop
  };
 }
 root.CatDuelClient={createClient};if(typeof module!=='undefined')module.exports={createClient};
})(typeof window==='undefined'?globalThis:window);
