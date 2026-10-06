(()=>{
 'use strict';
 const screen=document.createElement('section');screen.id='cat-modes';screen.hidden=true;screen.innerHTML='<div class="mode-card" role="dialog" aria-modal="true" aria-label="ゲームモード"></div>';document.body.appendChild(screen);
 const card=screen.firstElementChild,network=document.createElement('div');network.id='duel-network';network.setAttribute('role','status');document.body.appendChild(network);
 let resultData=null,lastGame='solo',settingsParent='title',introTimer=null,matchSeat=0,reconnectReturn=null,leaveParent='playing';
 const menuButton=document.createElement('button');menuButton.id='duel-menu-button';menuButton.innerHTML='<span aria-hidden="true">Ⅱ</span>' ;menuButton.setAttribute('aria-label','対戦メニュー');menuButton.hidden=true;document.body.append(menuButton);menuButton.onclick=()=>send('RequestGameMenu');
 let target=null,ready=false,current='title',busy=false,showingRanking=false,saved=null;
 try{saved=JSON.parse(localStorage.getItem('CatSmartball.Room.v3'));}catch{}
 const config=window.CAT_RANKING_CONFIG;
 const send=(method,arg='')=>{if(window.smartball&&target)window.smartball.SendMessage(target,method,arg);if(method==='StartOnline'){lastGame='online';const start=JSON.parse(arg);matchSeat=start.seat;if((start.state?.number??0)===0)showIntro();else showPlaying();}};
 function showPlaying(){if(introTimer)clearTimeout(introTimer);introTimer=null;screen.hidden=true;current='playing';menuButton.hidden=lastGame==='solo';send('CloseModeMenu');}
 function showIntro(){render('start');send('HoldMatchInput');introTimer=setTimeout(()=>{if(current==='start')showPlaying();},2400);}
 function token(){const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function rpc(action,key,code,data){
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),12000);
  try{const res=await fetch(config.url+'/rest/v1/rpc/smartball_room_v3',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_token:key,p_code:code,p_data:data}),signal:ac.signal});if(!res.ok)throw Error('network');const room=await res.json();if(room.error)throw Error(room.error);return room;}finally{clearTimeout(timer);}
 }
 const failures={not_found:'その合言葉の部屋は見つかりませんでした。',room_unavailable:'参加できない部屋です。新しい合言葉で試してね。',not_your_turn:'相手の番か、玉が動いています。',not_allowed:'この部屋には入り直せません。新しい対戦を始めてね。'};
 function error(e){return failures[e?.message]||'接続を確認しています。通信が戻るまで少し待ってね。';}
 const client=CatDuelClient.createClient({rpc,send,save(value){saved=value;try{if(value)localStorage.setItem('CatSmartball.Room.v3',JSON.stringify(value));else localStorage.removeItem('CatSmartball.Room.v3');}catch{}},onError(e){network.textContent=e?error(e):'';if(e&&current==='playing'){reconnectReturn='playing';render('reconnect');send('HoldMatchInput');}else if(!e&&current==='reconnect'&&reconnectReturn){reconnectReturn=null;showPlaying();}},onRoom(room){
  if(room.status==='waiting'){const waitingScreen=room.kind==='near'?'lobby':'matching';if(current!==waitingScreen)render(waitingScreen);const label=card.querySelector('.mode-code');if(label){label.textContent=room.kind==='near'?room.code:'相手を探しています';label.style.fontSize=room.kind==='near'?'36px':'21px';label.style.letterSpacing=room.kind==='near'?'.18em':'normal';}}
  else if(room.status==='abandoned'){send('FreezeMatch');render('ended');}
  else if(['playing','finished'].includes(room.status)){if(current==='lobby'||current==='matching'||current==='near'||current==='versus'||current==='title'){showPlaying();}}
 }});
 const catRow=colors=>'<div class="mode-cats" aria-hidden="true">'+colors.map(c=>'<span class="cat-avatar" data-color="'+c+'"></span>').join('')+'</div>';
 const cats=catRow([0,1,2,3]),duelCats=catRow([1,0]);
 const rules='<p class="mode-rules"><b class="mode-blue">1P：青</b>　<b class="mode-red">2P：赤</b><br>1発ずつ交代し、各13発で勝負！<br>16穴が先に埋まった場合も終了。<br>穴数ボーナスは各自の入球数で計算。</p>';
 const button=(label,action,cls='')=>'<button data-action="'+action+'" class="'+cls+'">'+label+'</button>';
 function render(which){
  if(introTimer){clearTimeout(introTimer);introTimer=null;}current=which;screen.hidden=false;menuButton.hidden=true;card.dataset.screen=which;
  let html='';
  if(which==='title')html='<img class="mode-hero" src="pop-art/title-hero.png" alt="ねこスマートボール">'+button('ひとりで遊ぶ','solo','primary')+button('対戦する','versus')+(saved?button('前の対戦に戻る','resume','small'):'')+button('ランキング','ranking','small');
  if(which==='versus')html='<img class="mode-versus-hero" src="pop-art/versus-header.png" alt="対戦する">'+button('CPUと対戦','cpu','primary')+button('合言葉で対戦','near')+button('オンライン対戦','match')+rules+button('戻る','title','small');
  if(which==='near')html='<h2>近くの人と対戦</h2><p>それぞれのスマホでこのゲームを開いてね。</p>'+button('部屋をつくる','create','primary')+'<p>相手から教わった合言葉を入力</p><input aria-label="合言葉（数字6桁）" id="duel-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="数字6桁">'+button('部屋に入る','join')+button('戻る','versus','small');
  if(which==='lobby')html='<h2>対戦相手を待っています</h2><p class="mode-code"></p><p>近くの人には、この合言葉を伝えてね。<br>オンラインは参加者同士で自動的につながります。</p>'+button('キャンセル','leave','small');
  if(which==='pause-menu'||which==='online-menu')html='<h2>対戦・ゲームメニュー</h2>'+button('ゲームに戻る','continue','primary')+button('ゲームを終了してタイトルへ','leave')+(which==='online-menu'?'<p>退出すると、この対戦は終了します。</p>':'');
  if(which==='ended')html='<h2>対戦が終了しました</h2><p>相手が退出したか、接続が長く途切れました。</p>'+button('タイトルへ','leave','primary');
  const approved=window.renderApprovedMode?.(which,resultData,{seat:matchSeat});card.className=approved?'mode-root':'mode-card';
  card.innerHTML=approved||(html+'<p class="mode-message" role="status"></p>');
 }
 function message(text){const el=card.querySelector('.mode-message');if(el)el.textContent=text;}
 async function act(action){
  if(busy)return;if(!ready){message('ゲームの準備中です。少し待ってね。');return;}
  if(action==='settings')settingsParent=current;
  if(['title','versus','near','help','settings'].includes(action)){if(action==='title')resultData=null;render(action);return;}
  if(action==='save-settings'||action==='back-settings'){render(settingsParent);return;}
  if(action==='copy-code'){const code=card.querySelector('.mode-code')?.textContent;if(code)navigator.clipboard.writeText(code).catch(()=>message('合言葉を選択してコピーしてね'));return;}
  if(action==='replay'){if(resultData?.online){render('versus');return;}action=lastGame;}
  if(action==='solo'||action==='cpu'){lastGame=action;matchSeat=0;resultData=null;send(action==='solo'?'StartSolo':'StartCpu');if(action==='cpu')showIntro();else showPlaying();return;}
  if(action==='continue'){showPlaying();send('ResumePlay');return;}
  if(action==='leave'&&['online-menu','pause-menu','start','leave'].includes(current)){leaveParent=current;render('leave');return;}
  if(action==='confirm-leave')action='leave';
  if(action==='ranking'){showingRanking=true;screen.hidden=true;send('OpenRanking');return;}
  busy=true;card.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
   if(action==='leave'){await client.leave();resultData=null;network.textContent='';send('ShowTitle');render('title');}
   else if(action==='resume'){if(saved)await client.start('read',saved.token,saved.code);}
   else if(action==='join'){const code=card.querySelector('#duel-code').value.trim();if(!/^\d{6}$/.test(code))throw Error('code');await client.start('join',token(),code);}
   else if(action==='create'||action==='match')await client.start(action,token());
  }catch(e){message(e.message==='code'?'合言葉は数字6桁で入力してね。':error(e));}
  finally{busy=false;card.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
 card.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='toggle-setting'){const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',String(on));if(b.tagName==='IMG')b.src=b.src.replace(/toggle-(on|off)/,'toggle-'+(on?'on':'off'));localStorage.setItem('Smartball.'+b.dataset.setting,on?'on':'off');return;}act(b.dataset.action);});
 card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button],[role=switch]')){e.preventDefault();e.target.click();}});
 screen.addEventListener('keydown',e=>{if(e.key==='Tab'){const list=[...card.querySelectorAll('button,input')].filter(x=>!x.disabled),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 window.CatModes={notice(name,data){target=name;if(data.clear){return;}else{const toast=document.createElement('div');toast.className='approved-bonus';toast.textContent=['赤','青','黄','緑'][data.color]+' 4つ連結！ ＋2,000';document.body.append(toast);setTimeout(()=>toast.remove(),2300);}},result(name,data){target=name;resultData=data;render(data.duel?(data.winner<0?'draw':data.winner===(data.seat??0)?'win':'lose'):'solo-result');},open(name,which){target=name;if(ready)render(which);},ready(){ready=true;render('title');},action(kind,value,turn){client.action(kind,value,turn);},played(){client.played();},outcome(json){client.outcome(JSON.parse(json));}};
 window.addEventListener('cat-ranking-closed',()=>{showingRanking=false;resultData=null;send('ShowTitle');render('title');});
})();
