(()=>{
const form=document.querySelector('.contact-form');if(!form)return;
const lang=document.documentElement.lang||'en',country=form.elements.country,dial=form.elements.dialCode,button=form.querySelector('[type=submit]'),note=form.querySelector('.contact-delivery-note'),status=form.querySelector('.contact-status');
const copy={en:['Send inquiry','Sending…','Your inquiry has been sent. Thank you.','We could not confirm sending. Please retry or contact office@progames.pl.','Send your inquiry directly to our team.'],es:['Enviar consulta','Enviando…','Tu consulta se ha enviado. Gracias.','No hemos podido confirmar el envío. Inténtalo de nuevo o escribe a office@progames.pl.','Envía tu consulta directamente a nuestro equipo.'],pl:['Wyślij zapytanie','Wysyłanie…','Twoje zapytanie zostało wysłane. Dziękujemy.','Nie udało się potwierdzić wysyłki. Spróbuj ponownie lub napisz na office@progames.pl.','Wyślij zapytanie bezpośrednio do naszego zespołu.'],de:['Anfrage senden','Wird gesendet…','Ihre Anfrage wurde gesendet. Vielen Dank.','Der Versand konnte nicht bestätigt werden. Bitte versuchen Sie es erneut oder schreiben Sie an office@progames.pl.','Senden Sie Ihre Anfrage direkt an unser Team.'],fr:['Envoyer la demande','Envoi en cours…','Votre demande a été envoyée. Merci.','Nous ne pouvons pas confirmer l’envoi. Réessayez ou écrivez à office@progames.pl.','Envoyez votre demande directement à notre équipe.']}[lang]||[];
let enabled=false,touched=false,codes={},requestId=null;const defaults={en:'GB',es:'ES',pl:'PL',de:'DE',fr:'FR'};
function choose(code){if(!codes[code])return;country.value=code;dial.value=codes[code]}
country.addEventListener('change',()=>{touched=true;choose(country.value)});dial.addEventListener('input',()=>touched=true);form.addEventListener('input',()=>{requestId=null;status.textContent=''});
const names=new Intl.DisplayNames([lang],{type:'region'});[...country.options].forEach(o=>o.textContent=names.of(o.value));[...country.options].sort((a,b)=>a.textContent.localeCompare(b.textContent,lang)).forEach(o=>country.append(o));
fetch('/assets/data/countries.json').then(r=>r.json()).then(data=>{codes=data;if(!touched)choose(defaults[lang]||'GB')}).catch(()=>{});
fetch('/api/contact',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(async data=>{if(!data)return;enabled=!!data.enabled;if(enabled){button.textContent=copy[0];note.textContent=copy[4]}if(data.country&&!touched){if(!Object.keys(codes).length)codes=await fetch('/assets/data/countries.json').then(r=>r.json());if(!touched)choose(data.country)}}).catch(()=>{});
window.PG_SEND_INQUIRY=async data=>{
 data.set('country',country.value+' — '+country.selectedOptions[0].textContent);data.delete('website');
 if(!enabled){location.href=window.PG_INQUIRY_URL(data);return}
 if(button.disabled)return;button.disabled=true;button.textContent=copy[1];status.textContent='';
 try{requestId ||= crypto.randomUUID();const payload=Object.fromEntries(data);payload.country=country.value;payload.countryName=country.selectedOptions[0].textContent;payload.website=form.elements.website.value;payload.language=lang;payload.requestId=requestId;
 const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok||!result.ok)throw Error('send');status.textContent=copy[2];requestId=null;
 }catch{status.textContent=copy[3]}finally{button.disabled=false;button.textContent=copy[0]}
};
})();
