/* Accessible native disclosure: works without JavaScript; enhancements preserve page state. */
(()=>{
 const menus=[...document.querySelectorAll('.pg-language')];
 function sync(){
  document.querySelectorAll('.pg-language a').forEach(a=>{
   const url=new URL(a.href,location.href);
   url.search=location.search;url.hash=location.hash;
   // A legacy ?model= address maps to the actual product in every language.
   const model=new URLSearchParams(location.search).get('model');
   if(document.body.dataset.pageKind==='product'&&model&&window.PG_ROUTES){url.pathname=window.PG_ROUTES.product(a.lang,model);url.searchParams.delete('model');}
   a.href=url.pathname+url.search+url.hash;
  });
 }
 menus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open){sync();menus.forEach(other=>{if(other!==menu)other.open=false;});}}));
 document.addEventListener('click',event=>{menus.forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')menus.forEach(menu=>{if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});});
 window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);
 sync();window.PG_LOCALIZE?.();
})();
