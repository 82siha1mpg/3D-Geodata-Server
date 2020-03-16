const Buffer = require('buffer').Buffer;
const fsExtra = require('fs-extra');
//var extractB3dm = require('./lib/extractB3dm');


exports.createB3dm = function(BatchBinary, Updated_feature,Updated_Batch,updated_GLB,file){
 const magic = Buffer.from('b3dm','utf8');
 const version = Buffer.alloc(4);
 version.writeUInt32LE(1,0);
 const featureTableJsonBuffer = Buffer.from(JSON.stringify(Updated_feature),'utf8');
 const featureTableBinaryBuffer = Buffer.alloc(0);
 const batchTableJsonBuffer = Buffer.from(JSON.stringify(Updated_Batch),'utf8');

 //const batchTableBinaryBuffer = Buffer.alloc(0);   
 const batchTableBinaryBuffer = BatchBinary;   
 const glbBuffer = updated_GLB;

 const totalbytlelength = 28+featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + glbBuffer.length
 /**
  * Byte 0-4 :   Magic
  * Byte 4-8 :   Version
  * Byte 8-12 :  byteLength
  * Byte 12-16 : featureTableJsonByteLength
  * Byte 16-20 : featureTableBinaryByteLength
  * Byte 20-24 : batchTableJsonByteLength
  * Byte 24-28 : batchTableBinaryByteLength
  * Byte 28-totalBytelength: GLB Buffer
  */
 var byteLength = new Buffer.alloc(4); // start after magic and version
 byteLength.writeUInt32LE(totalbytlelength,0);
 var featureTableJsonByteLength = new Buffer.alloc(4);
 featureTableJsonByteLength.writeUInt32LE(featureTableJsonBuffer.length,0)
 var featureTableBinaryByteLength = new Buffer.alloc(4);
 featureTableBinaryByteLength.writeUInt32LE(0,0); // mostly b3dm has 0 length binary in feature tables.
 var batchTableJsonByteLength = new Buffer.alloc(4);
 batchTableJsonByteLength.writeUInt32LE(batchTableJsonBuffer.length,0);
 var batchTableBinaryByteLength = new Buffer.alloc(4);
 //batchTableBinaryByteLength.writeUInt32LE(0,0);
 batchTableBinaryByteLength.writeUInt32LE(batchTableBinaryBuffer.length,0);
 
/*
console.log(magic,
     version,
     byteLength,
     featureTableJsonByteLength,
     featureTableBinaryByteLength,
     batchTableJsonByteLength,
     batchTableBinaryByteLength,
     featureTableJsonBuffer,
     featureTableBinaryBuffer,
     batchTableJsonBuffer,
     batchTableBinaryBuffer,  
     glbBuffer)
*/

 const new_b3dm_binary = Buffer.concat([
                                        magic,
                                        version,
                                        byteLength,
                                        featureTableJsonByteLength,
                                        featureTableBinaryByteLength,
                                        batchTableJsonByteLength,
                                        batchTableBinaryByteLength,
                                        featureTableJsonBuffer,
                                        featureTableBinaryBuffer,
                                        batchTableJsonBuffer,
                                        batchTableBinaryBuffer,  
                                        glbBuffer
                                    ]);
 fsExtra.writeFileSync(file,new_b3dm_binary);
 /* const a = extractB3dm(new_b3dm_binary);
 console.log(a); */
}
