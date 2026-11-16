import {WHEEL_PLAYBOOK} from './wheel-playbook.js';
const main=document.querySelector('#wheel-guides');
for(const [kind,g] of Object.entries(WHEEL_PLAYBOOK)){
 const article=document.createElement('article');article.className='guide-card';article.id=kind;
 article.innerHTML='<header><p class="eyebrow"></p><h2></h2></header><p class="premise"></p><blockquote></blockquote><h3>How Faith runs the turn</h3><ol></ol><div class="worked-example"><strong>Example</strong><p></p></div><h3>Stream pacing</h3><p class="rhythm"></p><h3>What Faith can change</h3><p class="settings"></p><p class="remember"></p><a class="try-wheel">Try this wheel ↗</a>';
 article.querySelector('.eyebrow').textContent=g.tag;article.querySelector('h2').textContent=g.title;article.querySelector('.premise').textContent=g.premise;article.querySelector('blockquote').textContent='“'+g.line+'”';
 for(const step of g.steps){const li=document.createElement('li');li.textContent=step;article.querySelector('ol').append(li);}
 article.querySelector('.worked-example p').textContent=g.example;article.querySelector('.rhythm').textContent=g.rhythm;article.querySelector('.settings').textContent=g.settings;article.querySelector('.remember').textContent=g.remember;article.querySelector('.try-wheel').href='./wheel-lab.html?game='+kind;main.append(article);
}
document.querySelector('#print-guide').onclick=()=>window.print();
if(['stack','crowns','climb','jackpot'].includes(location.hash.slice(1)))document.getElementById(location.hash.slice(1)).scrollIntoView();
