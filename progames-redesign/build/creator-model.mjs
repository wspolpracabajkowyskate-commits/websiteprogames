import fs from 'node:fs';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {buildMachine} from '../creator/src/model.js';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()})} readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.()})}};
const data=await new GLTFExporter().parseAsync(buildMachine(),{binary:true});fs.writeFileSync('creator/models/double-strike-studio.glb',Buffer.from(data));console.log('Studio GLB',data.byteLength,'bytes');
