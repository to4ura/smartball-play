(()=>{
 'use strict';
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw Error('storage');}};}
 const store=CatRankingStore.createStore(window.CAT_RANKING_CONFIG||{},{storage});
 const overlay=document.createElement('section');overlay.id='cat-ranking';overlay.hidden=true;
 overlay.innerHTML=`<div class="cat-card" role="dialog" aria-modal="true" aria-labelledby="cat-title"><header><span aria-hidden="true">🐾</span><h2 id="cat-title">みんなのランキング</h2><button class="cat-close" aria-label="ゲームに戻る">×</button></header><p>ねこスマートボール · ベストスコア</p><p id="cat-sync" class="cat-status" role="status"></p><section id="cat-board"><div class="cat-own" id="cat-own"></div><div class="cat-actions"><button id="cat-profile" class="cat-primary">名前を登録</button><button id="cat-refresh">更新</button></div><ol class="cat-list" id="cat-list" aria-label="ランキング上位25人"></ol><p class="cat-foot">上位25人を表示。同点は同じ順位です。<br>4穴ごとに +2,000点のルールで集計</p></section><section id="cat-register" hidden><div class="cat-tabs"><button type="button" data-mode="register" aria-pressed="true">はじめて登録</button><button type="button" data-mode="login" aria-pressed="false">つづきから</button></div><form class="cat-form"><label for="cat-name">なまえ（8文字まで）</label><input id="cat-name" autocomplete="username" maxlength="16" required placeholder="ねこのなまえ"><label for="cat-pin">あいことば（数字4桁）</label><input id="cat-pin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]{4}" required placeholder="数字4桁"><small>別のスマホでも、この名前とあいことばで引き継げます。<br>忘れないようにメモしてね。名前と記録はみんなに公開されます。</small><div id="cat-avatar-picker"><label>好きな猫を選んでね</label><div class="cat-avatars"></div></div><button type="submit" class="cat-primary cat-submit">この名前で登録</button></form><div class="cat-actions"><button id="cat-back">ランキングに戻る</button></div></section><p class="cat-status" id="cat-message" role="status"></p></div>`;
 document.body.appendChild(overlay);
 const $=id=>document.getElementById(id);
 let mode='register',avatar=0,target=null,lastScore=0,busy=false,request=0;
 const errors={invalid_name:'なまえは1〜8文字で入力してね。',invalid_pin:'あいことばは数字4桁で入力してね。',name_taken:'その名前は使われています。「つづきから」か別の名前を選んでね。',login_failed:'名前かあいことばが違います。',locked:'入力が続けて違ったため、5分ほど待ってから試してね。',invalid_season:'新しいゲームを読み込み直してください。',not_configured:'ランキングの準備中です。ゲームはそのまま遊べます。'};
 const message=(text,error=false)=>{$('cat-message').textContent=text;$('cat-message').dataset.error=String(error);};
 const errorText=e=>errors[e.message]||'通信できませんでした。回線を確認して、もう一度試してね。';
 function cat(color){const el=document.createElement('span');el.className='cat-avatar';el.dataset.color=String(color);el.setAttribute('aria-hidden','true');return el;}
 function updateProfile(){
  const p=store.profile;
  $('cat-profile').textContent=p?'名前を切り替える':'名前を登録';
  $('cat-own').textContent=p?p.name+' · ベスト '+(p.score||0).toLocaleString()+'点':'名前を登録してランキングに参加しよう！';
  $('cat-sync').textContent=store.pending?'記録を端末に保存しています。接続後に再送します。':p?'ゲーム終了時に自己ベストを自動登録':'登録せずにランキングを見ることもできます';
  if(!store.persistent)message('このブラウザでは端末に保存できません。ページを閉じる前に通信を確認してね。',true);
 }
 async function refresh(){
  const id=++request;updateProfile();$('cat-refresh').disabled=true;
  try{
   await store.sync();
   const data=await store.leaderboard();if(id!==request)return;
   updateProfile();$('cat-list').replaceChildren();
   if(!data.entries.length){const empty=document.createElement('li');empty.className='cat-empty';empty.textContent='まだ記録がありません。最初のスコアを残そう！';$('cat-list').appendChild(empty);}
   for(const row of data.entries){
    const li=document.createElement('li');li.className='cat-row';li.dataset.own=String(row.name===store.profile?.name);
    const rank=document.createElement('span');rank.className='cat-rank';rank.textContent=row.rank;
    const name=document.createElement('span');name.className='cat-name';name.textContent=row.name;
    const score=document.createElement('span');score.className='cat-score';score.textContent=row.score.toLocaleString();
    li.append(rank,cat(row.avatar),name,score);$('cat-list').appendChild(li);
   }
   if(data.own)$('cat-own').textContent=data.own.name+' · '+data.own.rank+'位 · '+data.own.score.toLocaleString()+'点';
   if(store.persistent)message('');
  }catch(e){if(id===request){updateProfile();message(errorText(e),true);}}
  finally{if(id===request)$('cat-refresh').disabled=false;}
 }
 function showForm(show){$('cat-register').hidden=!show;$('cat-board').hidden=show;message('');if(show)$('cat-name').focus();}
 function setMode(next){mode=next;overlay.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('cat-avatar-picker').hidden=mode==='login';overlay.querySelector('[type=submit]').textContent=mode==='login'?'この名前でつづける':'この名前で登録';message('');}
 ['赤','青','黄','緑'].forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name+'の猫');b.setAttribute('aria-pressed',String(i===0));b.appendChild(cat(i));b.onclick=()=>{avatar=i;overlay.querySelectorAll('.cat-avatars button').forEach((el,j)=>el.setAttribute('aria-pressed',String(i===j)));};overlay.querySelector('.cat-avatars').appendChild(b);});
 overlay.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 $('cat-profile').onclick=()=>{showForm(true);setMode(store.profile?'login':'register');};
 $('cat-back').onclick=()=>{showForm(false);refresh();};$('cat-refresh').onclick=refresh;
 overlay.querySelector('form').onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;
  const button=overlay.querySelector('[type=submit]');button.disabled=true;message('確認しています…');
  const oldName=store.profile?.name;
  try{
   await store.account($('cat-name').value,$('cat-pin').value,mode,avatar);
   // Do not transfer a completed game belonging to another registered player.
   if(!oldName&&lastScore>0)store.queue(lastScore);
   $('cat-pin').value='';showForm(false);await refresh();
  }catch(error){message(errorText(error),true);}
  finally{busy=false;button.disabled=false;}
 };
 function close(){
  if(busy)return;overlay.hidden=true;request++;$('cat-pin').value='';
  if(window.smartball&&target)window.smartball.SendMessage(target,'CloseRanking','');
  document.getElementById('game')?.focus();
 }
 overlay.querySelector('.cat-close').onclick=close;
 overlay.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.stopPropagation();close();}
  if(e.key==='Tab'){
   const items=[...overlay.querySelectorAll('button,input')].filter(x=>!x.disabled&&x.offsetParent!==null),first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 window.CatRanking={
  open(data){target=data.target;lastScore=data.finished?data.score:0;overlay.hidden=false;showForm(false);refresh();overlay.querySelector('.cat-close').focus();},
  finish(score){lastScore=score;store.queue(score);store.sync().catch(()=>{});}
 };
 window.addEventListener('online',()=>{store.sync().then(()=>{if(!overlay.hidden)refresh();}).catch(()=>{if(!overlay.hidden)updateProfile();});});
 store.sync().catch(()=>{});
})();
