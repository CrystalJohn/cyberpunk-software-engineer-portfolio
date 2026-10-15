import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';
function measure(root){
 const dist=path.join(root,'dist'),assets=path.join(dist,'assets');
 const candidates=fs.readdirSync(assets).filter(n=>/\.(js|css)$/.test(n)),seen=new Set();
 function visit(text){for(const name of candidates)if(!seen.has(name)&&text.includes(name)){
  seen.add(name);if(name.endsWith('.js'))visit(fs.readFileSync(path.join(assets,name),'utf8'));
 }}
 visit(fs.readFileSync(path.join(dist,'index.html'),'utf8'));
 return [...seen].sort().map(file=>{const b=fs.readFileSync(path.join(assets,file));return {file,bytes:b.length,gzipBytes:zlib.gzipSync(b).length}});
}
const before=measure(process.argv[2]),after=measure(process.cwd());
const sum=(files,ext)=>files.filter(x=>x.file.endsWith(ext)).reduce((s,f)=>s+f.gzipBytes,0);
const result={method:'Active HTML/JS asset graph only; gzipSync bytes. Not runtime performance.',before,after,jsGzipDelta:sum(after,'.js')-sum(before,'.js'),cssGzipDelta:sum(after,'.css')-sum(before,'.css')};
fs.writeFileSync('docs/m1/bundle-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
