(()=>{
 'use strict';
 const screen=document.createElement('section');screen.id='cat-modes';screen.hidden=true;screen.innerHTML='<div class="mode-card" role="dialog" aria-modal="true" aria-label="ゲームモード"></div>';document.body.appendChild(screen);
 const card=screen.firstElementChild,network=document.createElement('div');network.id='duel-network';network.setAttribute('role','status');document.body.appendChild(network);
 let target=null,ready=false,current='title',busy=false,showingRanking=false,saved=null;
 try{saved=JSON.parse(localStorage.getItem('CatSmartball.Room.v2'));}catch{}
 const config=window.CAT_RANKING_CONFIG;
 const send=(method,arg='')=>{if(window.smartball&&target)window.smartball.SendMessage(target,method,arg);};
 function token(){const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function rpc(action,key,code,data){
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),12000);
  try{const res=await fetch(config.url+'/rest/v1/rpc/smartball_room_v2',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_token:key,p_code:code,p_data:data}),signal:ac.signal});if(!res.ok)throw Error('network');const room=await res.json();if(room.error)throw Error(room.error);return room;}finally{clearTimeout(timer);}
 }
 const failures={not_found:'その合言葉の部屋は見つかりませんでした。',room_unavailable:'参加できない部屋です。新しい合言葉で試してね。',not_your_turn:'相手の番か、玉が動いています。',not_allowed:'この部屋には入り直せません。新しい対戦を始めてね。'};
 function error(e){return failures[e?.message]||'接続を確認しています。通信が戻るまで少し待ってね。';}
 const client=CatDuelClient.createClient({rpc,send,save(value){saved=value;try{if(value)localStorage.setItem('CatSmartball.Room.v2',JSON.stringify(value));else localStorage.removeItem('CatSmartball.Room.v2');}catch{}},onError(e){network.textContent=e?error(e):'';},onRoom(room){
  if(room.status==='waiting'){if(current!=='lobby')render('lobby');const label=card.querySelector('.mode-code');if(label){label.textContent=room.kind==='near'?room.code:'相手を探しています';label.style.fontSize=room.kind==='near'?'36px':'21px';label.style.letterSpacing=room.kind==='near'?'.18em':'normal';}}
  else if(room.status==='abandoned'){send('FreezeMatch');render('ended');}
  else if(['playing','finished'].includes(room.status)){if(current==='lobby'||current==='near'||current==='versus'||current==='title'){screen.hidden=true;current='playing';send('CloseModeMenu');}}
 }});
 const cats='<div class="mode-cats" aria-hidden="true">'+[0,1,2,3].map(c=>'<span class="cat-avatar" data-color="'+c+'"></span>').join('')+'</div>';
 const rules='<p class="mode-rules"><b class="mode-blue">1P：青・緑</b>　<b class="mode-red">2P：赤・黄</b><br>1発ずつ交代し、各13発で勝負！<br>16穴が先に埋まった場合も終了。<br>穴数ボーナスは各自の入球数で計算。</p>';
 const button=(label,action,cls='')=>'<button data-action="'+action+'" class="'+cls+'">'+label+'</button>';
 function render(which){
  current=which;screen.hidden=false;
  let html='';
  if(which==='title')html='<p>ころん、と入れて。そろえて、競おう。</p><h1>ねこ<br>スマートボール</h1>'+cats+button('一人であそぶ','solo','primary')+button('対戦する','versus')+(saved?button('前の対戦に戻る','resume','small'):'')+button('ランキング','ranking','small');
  if(which==='versus')html='<h2>だれと対戦する？</h2>'+cats+button('VS CPU','cpu','primary')+button('VS 近くの人','near')+button('VS オンライン','match')+rules+button('戻る','title','small');
  if(which==='near')html='<h2>近くの人と対戦</h2><p>それぞれのスマホでこのゲームを開いてね。</p>'+button('部屋をつくる','create','primary')+'<p>相手から教わった合言葉を入力</p><input aria-label="合言葉（数字6桁）" id="duel-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="数字6桁">'+button('部屋に入る','join')+button('戻る','versus','small');
  if(which==='lobby')html='<h2>対戦相手を待っています</h2><p class="mode-code"></p><p>近くの人には、この合言葉を伝えてね。<br>オンラインは参加者同士で自動的につながります。</p>'+button('キャンセル','leave','small');
  if(which==='pause-menu'||which==='online-menu')html='<h2>対戦・ゲームメニュー</h2>'+button('ゲームに戻る','continue','primary')+button('ゲームを終了してタイトルへ','leave')+(which==='online-menu'?'<p>退出すると、この対戦は終了します。</p>':'');
  if(which==='ended')html='<h2>対戦が終了しました</h2><p>相手が退出したか、接続が長く途切れました。</p>'+button('タイトルへ','leave','primary');
  card.innerHTML=html+'<p class="mode-message" role="status"></p>';card.querySelector('button')?.focus();
 }
 function message(text){const el=card.querySelector('.mode-message');if(el)el.textContent=text;}
 async function act(action){
  if(busy)return;if(!ready){message('ゲームの準備中です。少し待ってね。');return;}
  if(['title','versus','near'].includes(action)){render(action);return;}
  if(action==='solo'||action==='cpu'){screen.hidden=true;current='playing';send(action==='solo'?'StartSolo':'StartCpu');return;}
  if(action==='continue'){screen.hidden=true;current='playing';send('ResumePlay');return;}
  if(action==='ranking'){showingRanking=true;screen.hidden=true;send('OpenRanking');return;}
  busy=true;card.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
   if(action==='leave'){await client.leave();network.textContent='';send('ShowTitle');render('title');}
   else if(action==='resume'){if(saved)await client.start('read',saved.token,saved.code);}
   else if(action==='join'){const code=card.querySelector('#duel-code').value.trim();if(!/^\d{6}$/.test(code))throw Error('code');await client.start('join',token(),code);}
   else if(action==='create'||action==='match')await client.start(action,token());
  }catch(e){message(e.message==='code'?'合言葉は数字6桁で入力してね。':error(e));}
  finally{busy=false;card.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
 card.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)act(b.dataset.action);});
 screen.addEventListener('keydown',e=>{if(e.key==='Tab'){const list=[...card.querySelectorAll('button,input')].filter(x=>!x.disabled),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 window.CatModes={open(name,which){target=name;if(ready)render(which);},ready(){ready=true;render('title');},action(kind,value,turn){client.action(kind,value,turn);},played(){client.played();},outcome(json){client.outcome(JSON.parse(json));}};
 window.addEventListener('cat-ranking-closed',()=>{if(showingRanking){showingRanking=false;render('title');}});
})();
