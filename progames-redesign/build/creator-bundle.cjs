require('fs').rmSync('creator/dist',{recursive:true,force:true});
require('esbuild').buildSync({entryPoints:['creator/src/entry.jsx'],outdir:'creator/dist',bundle:true,splitting:true,format:'esm',minify:true,metafile:true,target:['es2022'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
