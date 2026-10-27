import { readFile, writeFile } from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const root='results/campaign-v2', report=await read('results/wb-v2-final/summary.json'), final=await read(`${root}/final-balances.json`), config=await read(`${root}/config.json`);
const rates={firecrawl:.005,contextdev:.0022,scrapfly:.00015,spider:.0001,jina:.00000005,you:1,linkup:1,tinyfish:1,browserbase:1};
const starts={firecrawl:463,contextdev:63171,scrapfly:309,spider:2428.905325,jina:1495119,you:100,linkup:18.904,tinyfish:10,browserbase:null};
const units={firecrawl:'credits',contextdev:'credits',scrapfly:'credits',spider:'credits',jina:'tokens',you:'USD',linkup:'USD',tinyfish:'USD',browserbase:'list USD'};
const remaining=p=>{const d=final.find(e=>e.provider===p)?.data;if(!d)return null;switch(p){case 'firecrawl':return d.data.remainingCredits;case 'contextdev':return d.key_metadata.credits_remaining;case 'scrapfly':return d.subscription.usage.scrape.remaining;case 'spider':return d.data.credits;case 'jina':return d.data.balanceLeft;case 'you':return d.data.attributes.balance/100;case 'linkup':return d.balance;case 'tinyfish':return Number(d.available_balance);default:return null;}};
const { ledger } = await import('./v2-common.mjs');
const history=await ledger();
try{history.push(...(await readFile('providers/smoke.jsonl','utf8')).split('\n').filter(Boolean).map(JSON.parse).filter(e=>e.kind==='attempt').map(e=>({...e,kind:'provider-dispatch'})));}catch(e){if(e.code!=='ENOENT')throw e;}
const rows=[];
for(const [provider,start] of Object.entries(starts)){
 const spend=report.spend[provider]??{apiUsd:0,physicalCalls:0}, native=spend.apiUsd/rates[provider], end=remaining(provider);
 let quota={};if(['browserbase','tinyfish'].includes(provider)){
  quota=Object.fromEntries(['search','scrape'].map(track=>[track,{used:history.filter(e=>e.provider===provider&&e.track===track&&e.kind==='provider-dispatch').length,retainedLimit:provider==='tinyfish'&&track==='search'?11400:950}]));
 }
 const floor=start===null?null:start*.05;
 const signedWithinCap=spend.apiUsd<=config.caps[provider]+1e-8;
 const quotaPass=Object.values(quota).every(q=>q.used<=q.retainedLimit);
 const walletPass=end===null||provider==='jina'?null:end>=floor;
 const walletStatus=provider==='jina'?'NOT CHECKED (cached balance)':provider==='browserbase'?'NOT CHECKED (quota guard only)':walletPass===null?'NOT CHECKED (measurement unavailable)':walletPass?'PASS':'FAIL';
 const overhead=provider==='contextdev'?1:0;
 const residual=start!==null&&end!==null&&provider!=='jina'?native+overhead-(start-end):null;
 rows.push({provider,unit:units[provider],starting:start,ledgerNative:native,ledgerUsd:spend.apiUsd,measuredRemaining:end,floor,signedWithinCap,walletPass,walletStatus,quota,quotaPass,residualLedgerMinusWallet:residual,note:provider==='you'?'Owner cancelled further You.com calls after completed samples; collected rows retained, final wallet probe skipped.':provider==='jina'?'Observed root can be cached; signed safe allowance 834751.1 tokens governs, not an inferred wallet delta.':provider==='browserbase'?'No remaining quota endpoint; all historical physical requests plus smoke attempts counted per product. Frozen dispatch guards conservatively count all smoke rows, a stricter limit than this attempt-only reconciliation. Dollar cost is a list equivalent.':provider==='tinyfish'?'Wallet contract rates are zero; all historical requests counted, stricter than daily resets.':provider==='contextdev'?'Final measurement costs one credit, added as measurement overhead. Starting basis follows the initial one-credit measurement.':'Positive residuals can reflect conservative uncertain reservations; original signed events remain intact.'});
}
const unresolvedResiduals=rows.filter(r=>r.residualLedgerMinusWallet!==null&&Math.abs(r.residualLedgerMinusWallet)>1e-6).map(r=>({provider:r.provider,unit:r.unit,residual:r.residualLedgerMinusWallet}));
const fail=rows.filter(r=>!r.signedWithinCap||r.walletPass===false||!r.quotaPass);
await writeFile(`${root}/reconciliation.json`,JSON.stringify({at:new Date().toISOString(),rows,unresolvedResiduals,exactReconciliation:unresolvedResiduals.length?'NOT CHECKED: residuals not attributed':'PASS for measured noncached wallets',failures:fail.map(r=>r.provider)},null,2)+'\n');
const fmt=v=>v===null?'unavailable':Number(v.toFixed(6)).toString();
let md='# Campaign v2 budget reconciliation\n\nAll figures include dev pilots and interrupted dispatch reservations. Native wallet changes are reported separately from signed list-equivalent accounting. No purchases or upgrades.\n\n| Provider | Unit | Starting | Signed v2 spend | Measured remaining | 5% floor | Ledger / quota guard | Measured wallet floor |\n|---|---|---:|---:|---:|---:|---|---|\n';
for(const r of rows)md+=`| ${r.provider} | ${r.unit} | ${fmt(r.starting)} | ${fmt(r.ledgerNative)} | ${fmt(r.measuredRemaining)} | ${fmt(r.floor)} | ${r.signedWithinCap&&r.quotaPass?'PASS':'FAIL'} | ${r.walletStatus} |\n`;
md+='\nExact wallet/ledger reconciliation: '+(unresolvedResiduals.length?'NOT CHECKED. Residuals below are not attributed; cap and wallet-floor checks remain separate.':'PASS for measured noncached wallets.')+'\n';
md+='\n'+rows.map(r=>`- ${r.provider}: ${r.note}${Object.keys(r.quota).length?' Quotas: '+Object.entries(r.quota).map(([t,q])=>`${t} ${q.used}/${q.retainedLimit}`).join('; ')+'.':''}${r.residualLedgerMinusWallet===null?'':` Signed spend plus measurement overhead minus measured wallet decrease: ${fmt(r.residualLedgerMinusWallet)} ${r.unit}.`}`).join('\n')+'\n';
await writeFile(`${root}/reconciliation.md`,md);console.log(md);if(fail.length)process.exitCode=1;
