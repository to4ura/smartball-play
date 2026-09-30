(()=>{
 const ids={title:'title',versus:'versus',near:'near',lobby:'lobby','pause-menu':'pause','online-menu':'online-menu',ended:'network-ended',help:'help',settings:'settings','solo-result':'solo-result',win:'win',draw:'draw'};
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
  if(result){
   if(which==='solo-result'){screen.querySelector('.total').textContent=result.score.toLocaleString();screen.querySelector('.panel>b').hidden=result.score<result.best;}
   if(which==='win'){
    screen.querySelectorAll('.score-pair b').forEach((b,i)=>b.textContent=result.scores[i].toLocaleString());
    screen.querySelectorAll('.panel .row').forEach((r,i)=>r.querySelectorAll('b').forEach((b,j)=>b.textContent=i?'×'+result.multipliers[j].toFixed(1):result.counts[j]+'個'));
    if(result.winner===1)screen.querySelector('.ribbon').textContent='2P の勝ち！';
   }
   if(which==='draw')screen.querySelector('.panel').innerHTML='<div class="row"><span>1P 青</span><b>'+result.scores[0].toLocaleString()+'</b></div><div class="row"><span>2P 赤</span><b>'+result.scores[1].toLocaleString()+'</b></div>';
  }
  const back=screen.querySelector('.screen-title img');if(back){back.dataset.action=['help','settings'].includes(which)?'title':'versus';back.tabIndex=0;back.setAttribute('role','button');back.setAttribute('aria-label','戻る');}
  if(which==='settings')screen.querySelectorAll('.toggle').forEach((t,i)=>{t.dataset.action='toggle-setting';t.dataset.setting=['bgm','sound','reduced'][i];t.tabIndex=0;t.setAttribute('role','switch');const on=localStorage.getItem('Smartball.'+t.dataset.setting)!=='off';t.setAttribute('aria-checked',String(on));t.src=t.src.replace(/toggle-(on|off)/,'toggle-'+(on?'on':'off'));});
  const status=document.createElement('p');status.className='mode-message';status.setAttribute('role','status');screen.querySelector('.body').append(status);
  return wrapper.innerHTML;
 };
})();
