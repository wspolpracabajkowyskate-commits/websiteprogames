/* Isolated API contract test: fetch is mocked; no email is sent. */
const assert=require('assert/strict');
(async()=>{const previous={key:process.env.RESEND_API_KEY,from:process.env.CONTACT_FROM,fetch:global.fetch};let sent=0;try{
 process.env.RESEND_API_KEY='test-only';process.env.CONTACT_FROM='test@example.com';global.fetch=async(url,options)=>{sent++;assert.equal(url,'https://api.resend.com/emails');const b=JSON.parse(options.body);assert.deepEqual(b.to,['office@progames.pl']);assert.equal(b.reply_to,'test@example.com');assert(b.text.includes('configuration: Boxer Flash'));return {ok:true,json:async()=>({id:'mock'})}};
 const handler=require('../api/contact.js');let code,data;const res={setHeader(){},status(n){code=n;return this},json(v){data=v;return this}};
 const req={method:'POST',headers:{origin:'https://www.progamespoland.com','content-type':'application/json','x-forwarded-for':'v42-test'},body:{name:'Test',email:'test@example.com',country:'PL',dialCode:'+48',requestId:'00000000-0000-4000-8000-000000000000',configuration:'Boxer Flash / Blue / Wi-Fi',message:'Test'}};
 await handler(req,res);assert.equal(code,200);assert(data.ok);assert.equal(sent,1);
 req.body.email='invalid';await handler(req,res);assert.equal(code,400);assert.equal(sent,1);
 req.headers.origin='https://untrusted.example';await handler(req,res);assert.equal(code,403);assert.equal(sent,1);
 req.method='GET';await handler(req,res);assert.equal(code,200);assert.equal(data.enabled,true);
 console.log('PASS contact API: request/response, configuration payload, recipient, validation and origin checks; external delivery mocked.');
 }finally{global.fetch=previous.fetch;if(previous.key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=previous.key;if(previous.from===undefined)delete process.env.CONTACT_FROM;else process.env.CONTACT_FROM=previous.from;}})().catch(e=>{console.error(e);process.exitCode=1});
