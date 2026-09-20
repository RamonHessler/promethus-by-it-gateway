import http from "node:http";
import crypto from "node:crypto";
const PORT=process.env.PORT||3000;
const json=(res,status,body)=>{res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(body));};
async function bybit(path,auth=false){
 const headers={};const url="https://api.bybit.com"+path;
 if(auth){const key=process.env.BYBIT_API_KEY,secret=process.env.BYBIT_API_SECRET;if(!key||!secret)throw new Error("Bybit credentials not configured");const ts=Date.now().toString(),rw="5000",query=path.includes("?")?path.split("?")[1]:"";headers["X-BAPI-API-KEY"]=key;headers["X-BAPI-TIMESTAMP"]=ts;headers["X-BAPI-RECV-WINDOW"]=rw;headers["X-BAPI-SIGN"]=crypto.createHmac("sha256",secret).update(ts+key+rw+query).digest("hex");}
 const r=await fetch(url,{headers});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text.slice(0,200)}};return {status:r.status,data};
}
const server=http.createServer(async(req,res)=>{try{
 if(req.method!=="GET")return json(res,405,{error:"method_not_allowed"});
 if(req.url==="/health")return json(res,200,{ok:true,service:"prometheus-bybit-gateway"});
 if(req.url==="/bybit/public-time"){const x=await bybit("/v5/market/time");return json(res,x.status,{reachable:x.status===200,retCode:x.data?.retCode??null,retMsg:x.data?.retMsg??null});}
 if(req.url==="/bybit/account-status"){const x=await bybit("/v5/account/wallet-balance?accountType=UNIFIED",true);return json(res,x.status,{authenticated:x.status===200&&x.data?.retCode===0,retCode:x.data?.retCode??null,retMsg:x.data?.retMsg??null,accountType:x.data?.result?.list?.[0]?.accountType??null});}
 if(req.url==="/bybit/reconciliation"){const x=await bybit("/v5/account/wallet-balance?accountType=UNIFIED",true);const a=x.data?.result?.list?.[0];if(x.status!==200||x.data?.retCode!==0||!a)return json(res,x.status,{authenticated:false,retCode:x.data?.retCode??null,retMsg:x.data?.retMsg??null});const coins=(a.coin??[]).filter(c=>Number(c.walletBalance||0)!==0).map(c=>({coin:c.coin,walletBalance:Number(c.walletBalance||0),usdValue:Number(c.usdValue||0)}));return json(res,200,{authenticated:true,accountType:a.accountType??"UNIFIED",totalEquity:Number(a.totalEquity||0),totalWalletBalance:Number(a.totalWalletBalance||0),totalAvailableBalance:Number(a.totalAvailableBalance||0),coins,checkedAt:new Date().toISOString(),readOnly:true});}
 return json(res,404,{error:"not_found"});
}catch(e){return json(res,500,{error:e instanceof Error?e.message:"gateway_error"});}});
server.listen(PORT,"0.0.0.0",()=>console.log("gateway listening"));