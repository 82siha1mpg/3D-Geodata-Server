//const fs = require('fs');
//const zlib = require('zlib');
exports.extractCordsfromNode = function(geombuffer , relPosition){
    const vertexCount = Buffer.from(geombuffer).readUInt32LE(0) //header
    //const featureCount = Buffer.from(geombuffer).readUInt32LE(4) //header
    const type = "Float32"
    const elements = 3;

    var cordlist = [];
    const bodygeombuffer = geombuffer.slice(8, geombuffer.length)

    if(type == "Float32" && elements == 3){
        for(let i=0; i<(vertexCount*12); i = i+ 12){
            const x = Buffer.from(bodygeombuffer).readFloatLE(i)
            const y = Buffer.from(bodygeombuffer).readFloatLE(i+4)
            const z= Buffer.from(bodygeombuffer).readFloatLE(i+8)
            cordlist.push([relPosition[0]+x,relPosition[1]+y,relPosition[2]+z])
        }       
    }
    return cordlist
}
