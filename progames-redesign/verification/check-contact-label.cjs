// No real email or credentials: capture the provider request and exercise mailto fallbacks.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
process.env.RESEND_API_KEY='test-only';
const handler=require('../api/contact.js');
let payload,calls=0;
global.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');payload=JSON.parse(options.body);calls++;return {ok:true,json:async()=>({id:'mock'})}};
(async()=>{
for(const from of ['PRO GAMES <sender@example.com>','sender@example.com'])for(const product of ['Cyber Punch','', 'Double Hit\r\nInjected']){
 process.env.CONTACT_FROM=from;const req={method:'POST',headers:{origin:'https://www.progamespoland.com','content-type':'application/json','x-forwarded-for':String(calls)},body:{name:'Test',email:'customer@example.com',country:'PL',dialCode:'+48',requestId:'12345678-1234-1234-1234-123456789abc',product,message:'Test',configuration:'blue'}};
 const res={setHeader(){},status(n){this.code=n;return this},json(b){this.body=b;return this}};
 await handler(req,res);assert.equal(res.code,200);assert.equal(payload.from,'ZAPYTANIE ZE STRONY <sender@example.com>');assert.deepEqual(payload.to,['office@progames.pl']);assert.equal(payload.reply_to,'customer@example.com');assert.equal(payload.subject,'PRO GAMES inquiry: '+(product||'General').replace(/[\r\n]/g,' '));assert(payload.text.includes('configuration: blue'));
}
for(const lang of ['en','es','pl','de','fr']){
 const context={window:{},document:{documentElement:{lang}}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../site-config.js'),'utf8'),context);
 const url=new URL(context.window.PG_INQUIRY_URL(new Map([['product','Cyber Punch'],['message','Hello']])));assert.equal(url.searchParams.get('subject'),['pl','de','fr'].includes(lang)?'Pro Games — Inquiry — Cyber Punch':'Pro Games inquiry — Cyber Punch');assert.equal(url.pathname,'office@progames.pl');assert(url.searchParams.get('body').includes('Hello'));
}
console.log('PASS: 6 mocked provider requests and 5 language fallbacks; address, reply-to and body preserved. No email sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
