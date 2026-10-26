import { spawnSync } from 'node:child_process';
const run=(args)=>spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,NODE_ENV:'production',NEXT_DIST_DIR:'.next-build'}});
const generated=run(['node_modules/next/dist/bin/next','typegen']);if(generated.status!==0)process.exit(generated.status||1);
const checked=run(['node_modules/typescript/bin/tsc','--noEmit']);process.exit(typeof checked.status==='number'?checked.status:1);
