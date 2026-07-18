import {spawnSync} from 'node:child_process';
const variants=['general','communication-content','administration-gever','cms-web-process']; let failed=false;
for(const v of variants){const r=spawnSync(process.execPath,['scripts/render.mjs','--','--variant',v],{stdio:'inherit'}); if(r.status!==0) failed=true;}
if(failed) process.exit(1);
