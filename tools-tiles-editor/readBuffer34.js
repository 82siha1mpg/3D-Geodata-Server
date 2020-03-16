const Buffer = require('buffer').Buffer;

exports.readBuffer = function(buffer,componentType){
    var list = [];
    if(componentType == 5123){
        for(let i =0;i<buffer.length;i=i+2){
            value = Buffer.from(buffer,'hex').readUInt16LE(i);
            list.push(value);
        }
    }
    if(componentType == 5121){
        for(let i =0;i<buffer.length;i=i+1){
            value = Buffer.from(buffer,'hex').readUInt8(i);
            list.push(value);
        }
    }
    return list;
}