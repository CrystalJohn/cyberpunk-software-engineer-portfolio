import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.m1-tests',{recursive:true});
const base={bundle:true,platform:'node',format:'esm',loader:{'.css':'empty'},external:['react','react-dom/client','lucide-react'],logLevel:'silent'};
await build({...base,entryPoints:['src/MissionArchive.tsx'],outfile:'.m1-tests/MissionArchive.mjs',plugins:[{
  name:'simulated-motion-adapter',setup(builder){builder.onLoad({filter:/coverflow-controller\.ts$/},()=>({
    contents:'export function createCoverflowMotion(options){ return globalThis.__m1MotionFactory(options) }',loader:'js'
  }))}
}]});
await build({...base,entryPoints:['src/coverflow-layout.ts'],outfile:'.m1-tests/layout.mjs'});
await build({...base,entryPoints:['src/coverflow-controller.ts'],external:['gsap','gsap/ScrollTrigger'],outfile:'.m1-tests/controller.mjs'});
await build({...base,stdin:{contents:"export {createCoverflowMotion} from './src/coverflow-controller'; export {default as gsap} from 'gsap'; export {ScrollTrigger} from 'gsap/ScrollTrigger';",resolveDir:process.cwd(),loader:'ts'},outfile:'.m1-tests/real-controller.mjs'});
