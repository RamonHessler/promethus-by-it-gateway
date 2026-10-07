<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Prometheus Apocalypse V2</title>
<style>
:root{--bg:#05070d;--panel:#0b1220;--line:#1b2940;--text:#eaf2ff;--muted:#7f91ad;--cyan:#38dcff;--violet:#9b7cff;--green:#48f5a8;--red:#ff647b;--gold:#ffd166}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% -15%,#15243f 0,#070b13 36%,#03050a 100%);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(56,220,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(56,220,255,.035) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,#000,transparent)}
.app{max-width:1480px;margin:auto;padding:14px}.top,.card{background:rgba(11,18,32,.92);border:1px solid var(--line);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
.top{padding:17px 18px;display:flex;justify-content:space-between;gap:14px;align-items:center;position:sticky;top:8px;z-index:20;backdrop-filter:blur(14px)}
.brand small{color:var(--cyan);letter-spacing:.18em;font-weight:800}.brand h1{margin:4px 0 0;font-size:clamp(22px,4vw,34px)}.brand h1 span{color:var(--cyan)}
.badges{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.badge{padding:6px 9px;border:1px solid #27405f;border-radius:999px;font-size:11px;font-weight:800;background:#08101c}.ok{color:var(--green);border-color:#22604a}.lock{color:var(--gold);border-color:#66541e}.bad{color:var(--red);border-color:#6d2836}
nav{display:flex;gap:8px;overflow:auto;padding:13px 1px}nav button{background:#09111e;border:1px solid var(--line);color:var(--muted);padding:9px 13px;border-radius:11px;font-weight:800;white-space:nowrap}nav button.active{color:white;border-color:#2778a0;background:#0e2034}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:11px}.card{grid-column:span 3;padding:15px}.half{grid-column:span 6}.wide{grid-column:span 12}.metric{font-size:clamp(25px,4vw,36px);font-weight:900;margin-top:5px}.muted{color:var(--muted);font-size:12px}.title{font-size:11px;letter-spacing:.11em;color:var(--muted);font-weight:800}
.row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.055)}.row:last-child{border:0}.row b{font-size:13px}.row span,.row em{font-size:12px;color:var(--muted);font-style:normal}
.pos{color:var(--green)!important}.neg{color:var(--red)!important}.omega{box-shadow:inset 0 0 55px rgba(56,220,255,.035)}.nexus{box-shadow:inset 0 0 55px rgba(155,124,255,.035)}
.section{display:none}.section.active{display:grid}.wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:12px;min-width:800px}th,td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,.055);text-align:left}th{color:var(--muted);font-size:10px;letter-spacing:.07em}.empty{padding:24px;text-align:center;color:var(--muted)}
.audit{background:#050a12;border:1px solid #132238;border-radius:12px;padding:13px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#b6c5da;white-space:pre-wrap}
footer{text-align:center;color:var(--muted);font-size:11px;padding:22px}
@media(max-width:900px){.card{grid-column:span 6}.half,.wide{grid-column:span 12}.top{align-items:flex-start}}
@media(max-width:620px){.app{padding:9px}.card,.half,.wide{grid-column:span 12}.top{position:relative;top:0;flex-direction:column}.badges{justify-content:flex-start}.brand h1{font-size:24px}}
</style>
</head>
<body>
<div class="app">
<header class="top"><div class="brand"><small>PROMETHEUS / APOCALIPSE V2</small><h1>WAR ENGINE · <span>OMEGA × NEXUS</span></h1></div><div class="badges"><span id="engine" class="badge">CARREGANDO</span><span class="badge lock">DEMO AUTÔNOMO</span><span class="badge lock">REAL BLOQUEADO</span></div></header>
<nav id="nav"></nav>
<main>
<section id="arena" class="section active grid"></section>
<section id="operacoes" class="section grid"></section>
<section id="genealogia" class="section grid"></section>
<section id="ciclos" class="section grid"></section>
<section id="cofre" class="section grid"></section>
<section id="auditoria" class="section grid"></section>
</main>
<footer>Supabase Free + mercado Bybit · atualização automática a cada 10 segundos · nenhuma ordem REAL é enviada.</footer>
</div>
<script>
const S="https://isavxdltqrivkygbilvr.supabase.co";
const K="sb_publishable_JVW3oiLaj3mAajAfk8vBEA_VFntg5ZS";
const H={apikey:K,Authorization:"Bearer "+K};
const tabs=[["arena","Arena"],["operacoes","Operações"],["genealogia","Genealogia"],["ciclos","Ciclos / Rounds"],["cofre","Cofre"],["auditoria","Auditoria"]];
const fmt=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:2}).format(Number(n||0));
const pc=n=>(Number(n)>=0?"+":"")+Number(n||0).toFixed(3)+"%";
const cls=n=>Number(n)>=0?"pos":"neg";
document.querySelector("#nav").innerHTML=tabs.map((t,i)=>'<button class="'+(i?"":"active")+'" data-tab="'+t[0]+'">'+t[1]+'</button>').join("");
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));document.querySelector("#"+b.dataset.tab).classList.add("active")});
async function q(table,params=""){const r=await fetch(S+"/rest/v1/"+table+"?"+params,{headers:H,cache:"no-store"});if(!r.ok)throw new Error(table+" "+r.status);return r.json()}
async function market(symbol){
  try{
    const r=await fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol="+encodeURIComponent(symbol),{cache:"no-store"});
    const x=await r.json(); return Number(x?.result?.list?.[0]?.lastPrice||0)
  }catch{return 0}
}
async function load(){
 try{
  const [state,agents,pos,trades,cycles,vault,runs]=await Promise.all([
   q("apocalypse_state","select=*&id=eq.1"),
   q("apocalypse_agents","select=*&status=neq.EXTINCT&order=lineage.asc,generation.asc"),
   q("apocalypse_positions","select=*&status=eq.OPEN&order=opened_at.desc"),
   q("apocalypse_trades","select=*&order=executed_at.desc&limit=100"),
   q("apocalypse_cycles","select=*&order=cycle_number.desc&limit=500"),
   q("apocalypse_owner_vault","select=*&id=eq.1"),
   q("apocalypse_engine_runs","select=*&order=invoked_at.desc&limit=30")
  ]);
  const s=state[0]||{},v=vault[0]||{};
  const wealth=a=>Number(a.equity||0)+Number(a.reproduction_fund||0)+Number(a.safety_reserve||0);
  const omega=agents.filter(a=>a.lineage==="OMEGA"), nexus=agents.filter(a=>a.lineage==="NEXUS");
  const ow=omega.reduce((z,a)=>z+wealth(a),0),nw=nexus.reduce((z,a)=>z+wealth(a),0);
  const omx=Math.max(1,...omega.map(a=>Number(a.generation||1))),nmx=Math.max(1,...nexus.map(a=>Number(a.generation||1)));
  const pricePairs=await Promise.all(pos.map(async p=>[p.symbol,await market(p.symbol)]));
  const priceMap=Object.fromEntries(pricePairs);
  const e=document.querySelector("#engine");e.textContent=(s.engine_state||"—")+" · C"+(s.cycle_number||0);e.className="badge "+(s.engine_state==="PLAYING"?"ok":s.engine_state==="STOPPED"?"bad":"lock");
  document.querySelector("#arena").innerHTML=
   '<div class="card"><div class="title">CAPITAL DEMO</div><div class="metric">'+fmt(ow+nw)+'</div><div class="muted">Base inicial R$100 · R$50 por lado</div></div>'+
   '<div class="card"><div class="title">CICLO / ROUND</div><div class="metric">'+Number(s.cycle_number||0)+' / '+Number(s.round_number||1)+'</div><div class="muted">Motor '+(s.engine_state||"—")+'</div></div>'+
   '<div class="card"><div class="title">POSIÇÕES ABERTAS</div><div class="metric">'+pos.length+'</div><div class="muted">'+Number(s.max_open_positions||0)+' máx. por agente</div></div>'+
   '<div class="card"><div class="title">COFRE</div><div class="metric">'+fmt(v.balance)+'</div><div class="muted">Retirado '+fmt(v.withdrawn_total)+'</div></div>'+
   '<div class="card half omega"><div class="title">OMEGA LINEAGE</div><div class="metric">'+fmt(ow)+'</div><div class="row"><b>Agentes</b><span>'+omega.length+' / '+Math.max(1,Math.floor(ow/25))+'</span></div><div class="row"><b>Geração máxima</b><span>G'+omx+'</span></div><div class="row"><b>Rounds vencidos</b><span>'+Number(s.omega_round_wins||0)+'</span></div></div>'+
   '<div class="card half nexus"><div class="title">NEXUS LINEAGE</div><div class="metric">'+fmt(nw)+'</div><div class="row"><b>Agentes</b><span>'+nexus.length+' / '+Math.max(1,Math.floor(nw/25))+'</span></div><div class="row"><b>Geração máxima</b><span>G'+nmx+'</span></div><div class="row"><b>Rounds vencidos</b><span>'+Number(s.nexus_round_wins||0)+'</span></div></div>'+
   '<div class="card wide"><div class="title">MOTOR / CUSTOS</div><div class="row"><b>Alocação máxima</b><span>'+Number(s.max_position_pct||0)+'%</span></div><div class="row"><b>Take profit líquido</b><span class="pos">+'+Number(s.take_profit_pct||0)+'%</span></div><div class="row"><b>Stop líquido</b><span class="neg">-'+Number(s.stop_loss_pct||0)+'%</span></div><div class="row"><b>Edge mínimo adicional</b><span>'+Number(s.min_net_edge_pct||0)+'% acima dos custos</span></div><div class="row"><b>REAL</b><span>'+(s.real_trading_locked?"BLOQUEADO":"ATENÇÃO")+'</span></div></div>';

  document.querySelector("#operacoes").innerHTML=
   '<div class="card wide"><div class="title">POSIÇÕES DEMO ABERTAS</div><div class="wrap">'+(pos.length?'<table><thead><tr><th>Agente</th><th>Ativo</th><th>Capital</th><th>Alocação</th><th>Entrada</th><th>Atual</th><th>Variação</th><th>P&L líquido est.</th><th>Taxa entrada</th></tr></thead><tbody>'+pos.map(p=>{const a=agents.find(x=>x.id===p.agent_id),now=Number(priceMap[p.symbol]||p.entry_price),assetPct=(now/Number(p.entry_price)-1)*100,fee=Number(s.last_fee_rate||.001),slip=Math.max(.0002,Number(p.entry_slippage_pct||0)/100),exit=now*(1-slip),gross=Number(p.quantity)*exit,exitFee=gross*fee,net=gross-Number(p.invested_capital)-exitFee,netPct=Number(p.invested_capital)?net/Number(p.invested_capital)*100:0,base=Number(a?.cash||0)+pos.filter(x=>x.agent_id===p.agent_id).reduce((z,x)=>z+Number(x.invested_capital||0),0),alloc=base?Number(p.invested_capital)/base*100:0;return '<tr><td><b>'+(a?.code||"—")+'</b></td><td>'+p.symbol+'</td><td>'+fmt(p.invested_capital)+'</td><td>'+alloc.toFixed(1)+'%</td><td>'+Number(p.entry_price).toFixed(6)+'</td><td>'+now.toFixed(6)+'</td><td class="'+cls(assetPct)+'">'+pc(assetPct)+'</td><td class="'+cls(net)+'">'+fmt(net)+' · '+pc(netPct)+'</td><td>'+fmt(p.entry_fee)+'</td></tr>'}).join("")+'</tbody></table>':'<div class="empty">Nenhuma posição aberta.</div>')+'</div></div>'+
   '<div class="card wide"><div class="title">TRADES RECENTES</div><div class="wrap"><table><thead><tr><th>Hora</th><th>Lado</th><th>Ativo</th><th>Preço</th><th>Alocação</th><th>Taxa</th><th>P&L líquido</th></tr></thead><tbody>'+trades.map(t=>'<tr><td>'+new Date(t.executed_at).toLocaleString("pt-BR")+'</td><td>'+t.side+'</td><td>'+t.symbol+'</td><td>'+Number(t.price).toFixed(6)+'</td><td>'+(t.allocation_pct?Number(t.allocation_pct).toFixed(1)+"%":"—")+'</td><td>'+fmt(t.fee)+'</td><td class="'+(t.realized_pnl==null?"":cls(t.realized_pnl))+'">'+(t.realized_pnl==null?"entrada registrada":fmt(t.realized_pnl)+" · "+pc(t.net_return_pct))+'</td></tr>').join("")+'</tbody></table></div></div>';

  document.querySelector("#genealogia").innerHTML='<div class="card wide"><div class="title">ÁRVORE ATIVA</div>'+agents.map(a=>'<div class="row"><div><b>'+a.code+'</b><div class="muted">'+a.lineage+' · G'+a.generation+' · '+a.strategy_family+' v'+a.strategy_version+'</div></div><div style="text-align:right"><b>'+fmt(wealth(a))+'</b><div class="muted">'+(a.parent_id?"filho":"fundador G1")+'</div></div></div>').join("")+'</div>';

  document.querySelector("#ciclos").innerHTML='<div class="card wide"><div class="title">HISTÓRICO DE CICLOS · SEM TETO ARTIFICIAL</div><div class="wrap"><table><thead><tr><th>Ciclo</th><th>Round</th><th>Abertura</th><th>Fechamento</th><th>Δ líquido</th><th>OMEGA</th><th>NEXUS</th><th>Compras</th><th>Vendas</th><th>Taxas</th></tr></thead><tbody>'+cycles.map(x=>'<tr><td>#'+x.cycle_number+'</td><td>'+x.round_number+'</td><td>'+fmt(x.opening_total_wealth)+'</td><td>'+fmt(x.closing_total_wealth)+'</td><td class="'+cls(x.net_change)+'">'+fmt(x.net_change)+'</td><td>'+fmt(x.omega_wealth)+'</td><td>'+fmt(x.nexus_wealth)+'</td><td>'+x.buys+'</td><td>'+x.sells+'</td><td>'+fmt(x.fees)+'</td></tr>').join("")+'</tbody></table></div></div>';

  document.querySelector("#cofre").innerHTML='<div class="card half"><div class="title">SALDO NO COFRE</div><div class="metric">'+fmt(v.balance)+'</div><div class="muted">DEMO</div></div><div class="card half"><div class="title">RETIRADO HISTÓRICO</div><div class="metric">'+fmt(v.withdrawn_total)+'</div><div class="muted">Somente histórico</div></div><div class="card wide"><div class="audit">O cofre recebe somente parcelas de lucro líquido positivo. O histórico não é somado novamente ao patrimônio. O modo REAL continua bloqueado.</div></div>';

  document.querySelector("#auditoria").innerHTML='<div class="card wide"><div class="title">IDENTIDADE CONTÁBIL</div><div class="audit">Capital inicial: '+fmt(s.starting_total)+'\nPatrimônio operacional: '+fmt(ow+nw)+'\nCofre: '+fmt(v.balance)+'\nRetirado: '+fmt(v.withdrawn_total)+'\nFee rate referência: '+(Number(s.last_fee_rate||0)*100).toFixed(3)+'%\nREAL trading locked: '+(s.real_trading_locked?"SIM":"NÃO")+'\nKill switch: '+(s.kill_switch?"ATIVO":"DESLIGADO")+'\n\nP&L realizado, take profit e stop são registrados pelo motor líquido de custos.</div></div><div class="card wide"><div class="title">ÚLTIMAS EXECUÇÕES DO MOTOR</div>'+runs.map(r=>'<div class="row"><div><b>'+r.status+'</b><div class="muted">'+(r.message||"—")+'</div></div><span>'+new Date(r.invoked_at).toLocaleString("pt-BR")+'</span></div>').join("")+'</div>';
 }catch(err){console.error(err);const e=document.querySelector("#engine");e.textContent="ERRO DE DADOS";e.className="badge bad"}
}
load();setInterval(load,10000);
</script>
</body></html>