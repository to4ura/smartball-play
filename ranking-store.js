/* Shared by the browser UI and Node regression checks. */
(function(root){
 'use strict';
 const PROFILE='CatSmartball.Ranking.Profile.v1', PENDING='CatSmartball.Ranking.Pending.v1';
 function createStore(config,{storage,fetcher=fetch}={}){
  let memory={}, writable=true, inflight=null;
  const read=key=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return memory[key]||null;}};
  const write=(key,value)=>{memory[key]=value;try{storage.setItem(key,JSON.stringify(value));}catch{writable=false;}};
  let profile=read(PROFILE);
  if(!profile || typeof profile.name!=='string' || !/^\d{4}$/.test(profile.pin))profile=null;
  let pending=read(PENDING)||{};
  async function rpc(fn,args){
   if(!config.url||!config.key)throw Error('not_configured');
   const abort=new AbortController(), timer=setTimeout(()=>abort.abort(),12000);
   try{
    const response=await fetcher(config.url.replace(/\/+$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:abort.signal});
    if(!response.ok)throw Error('network');
    const data=await response.json();if(data.error)throw Error(data.error);return data;
   }finally{clearTimeout(timer);}
  }
  function queue(score){
   if(!profile||!Number.isInteger(score)||score<1||score>100000000)return;
   const key=config.season+':'+profile.name;
   pending[key]=Math.max(pending[key]||0,score);write(PENDING,pending);
  }
  async function sync(){
   if(inflight)return inflight;
   if(!profile)return;
   const owner={...profile}, key=config.season+':'+owner.name, score=pending[key];
   if(!score)return;
   inflight=(async()=>{
    const result=await rpc('smartball_submit',{p_name:owner.name,p_pin:owner.pin,p_score:score,p_season:config.season});
    if(profile?.name===owner.name){profile.score=Math.max(profile.score||0,result.score);write(PROFILE,profile);}
    if(pending[key]===score){delete pending[key];write(PENDING,pending);}
    return result;
   })();
   try{return await inflight;}finally{inflight=null;}
  }
  return {
   get profile(){return profile;},get persistent(){return writable;},
   get pending(){return profile ? pending[config.season+':'+profile.name]||0 : 0;},
   async account(name,pin,action,avatar){
    name=name.trim();if(!name||Array.from(name).length>8||/[\x00-\x1f\x7f]/.test(name))throw Error('invalid_name');
    if(!/^\d{4}$/.test(pin))throw Error('invalid_pin');
    const data=await rpc('smartball_account',{p_name:name,p_pin:pin,p_action:action,p_avatar:avatar});
    profile={...data,pin};write(PROFILE,profile);return profile;
   },
   async edit(name,avatar){
    if(!profile)throw Error('login_failed');
    name=name.trim();if(!name||Array.from(name).length>8||/[\x00-\x1f\x7f]/.test(name))throw Error('invalid_name');
    await sync();const owner={...profile};
    const data=await rpc('smartball_profile',{p_name:owner.name,p_pin:owner.pin,p_action:'update',p_new_name:name,p_avatar:avatar});
    const oldKey=config.season+':'+owner.name,newKey=config.season+':'+name;
    if(oldKey!==newKey&&pending[oldKey]){pending[newKey]=Math.max(pending[newKey]||0,pending[oldKey]);delete pending[oldKey];write(PENDING,pending);}
    profile={...data,pin:owner.pin};write(PROFILE,profile);return profile;
   },
   async remove(){
    if(!profile)throw Error('login_failed');
    if(inflight)await inflight;
    const owner={...profile};await rpc('smartball_profile',{p_name:owner.name,p_pin:owner.pin,p_action:'delete'});
    delete pending[config.season+':'+owner.name];write(PENDING,pending);profile=null;write(PROFILE,null);
   },
   logout(){profile=null;write(PROFILE,null);},queue,sync,
   leaderboard(){return rpc('smartball_leaderboard',{p_name:profile?.name||null,p_season:config.season});}
  };
 }
 root.CatRankingStore={createStore};
 if(typeof module!=='undefined')module.exports={createStore};
})(typeof window==='undefined'?globalThis:window);
