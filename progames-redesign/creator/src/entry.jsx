import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
createRoot(document.getElementById('creator-root')).render(<App/>);
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mobileNav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);document.body.classList.toggle('menu-open',open)});
