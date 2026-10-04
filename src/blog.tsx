import {createRoot} from 'react-dom/client';
import {GlassBlogCard} from '@/components/ui/glass-blog-card-shadcnui';
import data from './posts.json';
const author={name:'Ariq Ardian',avatar:'assets/profile-avatar.jpg'};
for(const section of document.querySelectorAll<HTMLElement>('.writeups,#more')){
 const items=section.id==='more'?data.extras:data.posts;
 const grid=document.createElement('div');grid.className='blog-grid';
 section.querySelectorAll(':scope > .note').forEach(item=>item.remove());
 section.append(grid);
 createRoot(grid).render(<>{items.map(item=><GlassBlogCard key={item.href} {...item} author={author}/>)}</>);
 if(!('IntersectionObserver' in window))continue;
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   entry.target.classList.toggle('card-in-view',entry.isIntersecting || entry.target.contains(document.activeElement));
 }),{threshold:0});
 const mounted=new MutationObserver(()=>{grid.querySelectorAll('.glass-blog-card').forEach(card=>observer.observe(card));grid.classList.add('has-card-reveal');});
 mounted.observe(grid,{childList:true});
 grid.addEventListener('focusin',event=>(event.target as Element).closest('.glass-blog-card')?.classList.add('card-in-view'));
}
