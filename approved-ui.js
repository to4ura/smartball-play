(()=>{
 const ids={title:'title',versus:'versus',near:'near',lobby:'lobby','pause-menu':'pause','online-menu':'online-menu',ended:'network-ended',help:'help',settings:'settings','solo-result':'solo-result',win:'win',lose:'win',draw:'draw'};
 const actions={title:['solo','versus','ranking','help','settings'],near:['create','join'],lobby:['copy-code','leave'],'pause-menu':['continue','settings','leave'],'online-menu':['continue','leave'],ended:['match','leave'],help:['title'],settings:['save-settings'],'solo-result':['replay','ranking'],win:['replay','leave'],draw:['replay','leave']};
 window.renderApprovedMode=(which,result)=>{
  const id=ids[which];if(!id||!window.APPROVED_SCREENS?.[id])return null;
  const wrapper=document.createElement('div');wrapper.innerHTML=APPROVED_SCREENS[id];
  const screen=wrapper.querySelector('.screen');
  screen.querySelectorAll('button').forEach((b,i)=>{if(actions[which]?.[i])b.dataset.action=actions[which][i];});
  if(which==='versus'){
   screen.querySelectorAll('.mode-card').forEach((c,i)=>{c.dataset.action=['cpu','near','match'][i];c.tabIndex=0;c.setAttribute('role','button');});
   screen.querySelector('button').dataset.action='title';
  }
  if(which==='near'){const input=screen.querySelector('input');input.id='duel-code';input.value='';input.placeholder='数字6桁';input.inputMode='numeric';input.maxLength=6;}
  if(which==='lobby'){const code=screen.querySelector('.code');if(code){code.classList.add('mode-code');code.textContent='';}}
  screen.querySelector('.screen-title')?.remove();
  if(result){
   if(which==='solo-result'){screen.querySelector('.total').textContent=result.score.toLocaleString();screen.querySelector('.panel>b').hidden=result.score<result.best;}
   if(['win','lose','draw'].includes(which)){
    const draw=which==='draw',red=result.winner===1;
    const body=screen.querySelector('.body');body.className='body result-v2';const resultButtons=[...body.querySelectorAll('button')].map((b,i)=>{b.dataset.action=i?'leave':'replay';if(i&&b.querySelector('span'))b.querySelector('span').textContent='ホームにもどる';return b.outerHTML;}).join('');
    body.innerHTML='<div class="duel-result '+(red?'team-red':'team-blue')+'"><h1>'+ (draw?'DRAW':which==='lose'?'LOSE':'WIN')+'</h1><div class="result-cats"><img src="approved-assets/PopArtV01/characters/cat-blue.png" alt="1P 青"><img src="approved-assets/PopArtV01/characters/cat-red.png" alt="2P 赤"></div><div class="ribbon">'+(draw?'引き分け！':(result.winner+1)+'P の勝ち！')+'</div><div class="panel" style="border-image-source:url(approved-assets/PopArtV01/panels/cream.png)"><div class="row"><span class="team-blue">1P</span><b>'+result.scores[0].toLocaleString()+'</b></div><div class="row"><span class="team-red">2P</span><b>'+result.scores[1].toLocaleString()+'</b></div></div>'+resultButtons+'</div>';
   }
  }
  if(which==='help'){const back=screen.querySelector('button');back.textContent='もどる';}
  const backAction={near:'versus',settings:'back-settings','solo-result':'leave'}[which];
  if(backAction){
   const temp=document.createElement('div');temp.innerHTML=APPROVED_SCREENS.versus;
   const back=temp.querySelector('button').cloneNode(true);back.dataset.action=backAction;back.textContent='もどる';back.classList.add('page-back');
   const existing=[...screen.querySelectorAll('button')].find(b=>/もどる|戻る|タイトルへ/.test(b.textContent));
   if(existing)existing.replaceWith(back);else screen.querySelector('.body').append(back);
  }
  const backTemplate=document.createElement('div');backTemplate.innerHTML=APPROVED_SCREENS.versus;
  screen.querySelectorAll('button').forEach(button=>{
   if(!/もどる|戻る|タイトルへ/.test(button.textContent)||button.dataset.action==='continue')return;
   const replacement=backTemplate.querySelector('button').cloneNode(true);
   replacement.dataset.action=button.dataset.action;replacement.classList.add('page-back');
   button.replaceWith(replacement);
  });
  if(which==='settings')screen.querySelectorAll('.toggle').forEach((t,i)=>{t.dataset.action='toggle-setting';t.dataset.setting=['bgm','sound','reduced'][i];t.tabIndex=0;t.setAttribute('role','switch');const on=localStorage.getItem('Smartball.'+t.dataset.setting)!=='off';t.setAttribute('aria-checked',String(on));t.src=t.src.replace(/toggle-(on|off)/,'toggle-'+(on?'on':'off'));});
  const status=document.createElement('p');status.className='mode-message';status.setAttribute('role','status');screen.querySelector('.body').append(status);
  return wrapper.innerHTML;
 };
})();
