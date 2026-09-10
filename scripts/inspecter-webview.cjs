const WS = require('ws');
const fs = require('fs');
const url = fs.readFileSync(require('path').join(__dirname,'..','.wsurl'),'utf8').trim();
const expr = fs.readFileSync(process.argv[2],'utf8');
const ws = new WS(url);
ws.on('open', () => ws.send(JSON.stringify({id:1, method:'Runtime.evaluate',
  params:{expression:`(async()=>{${expr}})()`, awaitPromise:true, returnByValue:true}})));
ws.on('message', m => {
  const d = JSON.parse(m);
  const r = d.result;
  if (r?.exceptionDetails) console.log('ERREUR:', r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
  else console.log(typeof r?.result?.value === 'string' ? r.result.value : JSON.stringify(r?.result?.value, null, 1));
  ws.close();
});
