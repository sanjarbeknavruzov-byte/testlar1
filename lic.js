/* Litsenziya: SHA-256 + HMAC (sof JS) */
const LIC = (() => {
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function sha256(bytes){
    const l=bytes.length, n=((l+9+63)>>6)<<6, m=new Uint8Array(n); m.set(bytes); m[l]=0x80;
    const bl=l*8; m[n-4]=bl>>>24; m[n-3]=(bl>>>16)&255; m[n-2]=(bl>>>8)&255; m[n-1]=bl&255;
    let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const w=new Uint32Array(64), r=(x,k)=>(x>>>k)|(x<<(32-k));
    for(let o=0;o<n;o+=64){
      for(let i=0;i<16;i++) w[i]=(m[o+4*i]<<24)|(m[o+4*i+1]<<16)|(m[o+4*i+2]<<8)|m[o+4*i+3];
      for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2]; w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(b,17)^r(b,19)^(b>>>10)))|0;}
      let [a,b,c,d,e,f,g,h]=H;
      for(let i=0;i<64;i++){
        const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0;
        const t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))|0;
        h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
      }
      H=[H[0]+a,H[1]+b,H[2]+c,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(x=>x|0);
    }
    const out=new Uint8Array(32); H.forEach((x,i)=>{out[4*i]=x>>>24;out[4*i+1]=(x>>>16)&255;out[4*i+2]=(x>>>8)&255;out[4*i+3]=x&255;}); return out;
  }
  const enc=s=>new TextEncoder().encode(s);
  function hmac(key,msg){
    let k=enc(key); if(k.length>64) k=sha256(k);
    const ip=new Uint8Array(64+msg.length), op=new Uint8Array(96);
    for(let i=0;i<64;i++){const b=k[i]||0; ip[i]=b^0x36; op[i]=b^0x5c;}
    ip.set(msg,64); op.set(sha256(ip),64); return sha256(op);
  }
  const AB="23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const norm=s=>String(s||"").toUpperCase().replace(/[^0-9A-Z]/g,"");
  function code(secret,id){ const h=hmac(secret,enc("v1:"+norm(id))); let s=""; for(let i=0;i<8;i++) s+=AB[h[i]%AB.length]; return s.slice(0,4)+"-"+s.slice(4); }
  function newId(){ const b=new Uint8Array(8); (globalThis.crypto&&crypto.getRandomValues)?crypto.getRandomValues(b):b.forEach((_,i)=>b[i]=Math.random()*256); let s=""; for(const x of b) s+=AB[x%AB.length]; return s.slice(0,4)+"-"+s.slice(4); }
  return {sha256, hmac, code, newId, norm, hex:b=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("")};
})();
