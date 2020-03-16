const fs = require('fs');
const zlib = require('zlib');

/**
 * 
 */
exports.UpdateAttributesDel = function(sceneBasePath , fields,  deleteGMLID , readNode){
    //const readNode = "2"
    //console.log(sceneBasePath+ "/" +readNode + "/attributes/"+fields[0]+"/0.bin.gz")
    const GZgmlID  = fs.readFileSync(sceneBasePath+ "/" +readNode + "/attributes/"+fields[0]+"/0.bin.gz");
    const gmlIDBin = zlib.gunzipSync(GZgmlID);
    var gmlIDList = readAttributes(gmlIDBin);
    
    const GZgmlParentID  = fs.readFileSync(sceneBasePath+ "/" +readNode + "/attributes/"+ fields[1] +"/0.bin.gz");
    const gmlParentIDBin = zlib.gunzipSync(GZgmlParentID);
    const gmlParentIDList = readAttributes(gmlParentIDBin);
    const deleteObjectBoolean = findDeleteIndex(gmlIDList, gmlParentIDList, deleteGMLID)
    const sumfunc = deleteObjectBoolean => deleteObjectBoolean.reduce((total,crrVal) => total + crrVal, 0);
    const sumDelete= sumfunc(deleteObjectBoolean);
    if(sumDelete>0){
        //console.log("Deleted From Node:",readNode);
        //console.log("GML and Parent ID List: ",gmlIDList , gmlParentIDList )
       // console.log(deleteObjectBoolean)
        const updatedF1 = UpdateAttributes(deleteObjectBoolean, gmlIDList);
        const updatedF2 = UpdateAttributes(deleteObjectBoolean, gmlParentIDList);

        const GZIPupdatedF1 = zlib.gzipSync(updatedF1);
        const GZIPupdatedF2 = zlib.gzipSync(updatedF2);
        //console.log(updatedF1.length)
        //console.log(updatedF2.length)
        //console.log("Original id",gmlIDList)
        //console.log("Original Parent Id",gmlParentIDList)
        //console.log("Updated Id", readAttributes(updatedF1))
        //console.log("Updated Parent Id", readAttributes(updatedF2))
        /**
         * After updation, replace the existing files.
         */
        fs.writeFileSync(sceneBasePath+ "/" +readNode + "/attributes/"+ fields[0]+"/0.bin.gz", GZIPupdatedF1);
        fs.writeFileSync(sceneBasePath+ "/" +readNode + "/attributes/"+ fields[1] +"/0.bin.gz", GZIPupdatedF2);
        //console.log("Attribute are updated!");
    }
   // console.log("count of objects", deleteObjectBoolean.length);
    return deleteObjectBoolean;
}

function readAttributes(buffer){
    var tempList  = [];
   // var IndexList = [];
    const countObjects = Buffer.from(buffer,'utf-8').readInt32LE(0);
    const ObjectByteLength = []; //this list will store Byte size for each object in the Buffer.
    
    var startOffset = 8;
    for(let i=1;i<=countObjects;i++){
        const bytesize = Buffer.from(buffer,'utf-8').readInt32LE(startOffset);
        ObjectByteLength.push(bytesize);
        startOffset += 4
    }
    var OffsetStringValue = (countObjects + 2) * 4;
    body = buffer.slice(OffsetStringValue,buffer.length)
   // fs.writeFileSync("./0.bin",body)
    /**
     * ALl attributes can be found within OffsetStringValue and bufferEnd
     */
    for(let i=1;i<=countObjects;i++){
        const End =  (OffsetStringValue+ObjectByteLength[i-1])-1;
        const value = buffer.slice(OffsetStringValue,End).toString();
        
       // IndexList.push([OffsetStringValue,End]);
        OffsetStringValue += ObjectByteLength[i-1]; //Starting offset should now become the end of this buffer.
        tempList.push(value);
    }
    return tempList
}
function findDeleteIndex(gmlID, gmlParentID,DelGMLID){
    const indexList = [];
    for(let i=0;i<gmlParentID.length;i++){
        if(gmlID[i]==DelGMLID || gmlParentID[i]== DelGMLID){
            indexList.push(1)
            //console.log("deleted index", i)
        }
        else{
            indexList.push(0)
        }
    
    }
   // console.log("geom id list length", gmlParentID.length)
    return indexList
}

function UpdateAttributes(deleteObjectBoolean, AttributeList){
    //console.log(AttributeList)
    const OldCount = AttributeList.length;
    var deleteCount = 0;
    var headerByteLengthNew = 8; //8 bytes are for header that includes total count and total bytes, then 4 bytes for each element.
    var BodyByteLength = 0 ; 
    const newElementList = [];
    const ByteLengthforeachElement = [];
    for(let i=0;i<OldCount;i++){
        if(deleteObjectBoolean[i] == 1){
            deleteCount += 1
        }
        else{
            newElementList.push(AttributeList[i])
            headerByteLengthNew += 4;
            BodyByteLength += AttributeList[i].length+1
            ByteLengthforeachElement.push(AttributeList[i].length+1)
        }
    }
    //console.log(buffer)
    //console.log(OldCount,deleteCount,headerByteLengthNew,BodyByteLength,ByteLengthforeachElement)
    const newCount = AttributeList.length - deleteCount;

    const newheaderArray = new Buffer.alloc(headerByteLengthNew);
    /**
     * Total Count of New Objects
     * Body Byte Length
     * 
     */
    newheaderArray.writeUInt32LE(newCount,0);
    newheaderArray.writeUInt32LE(BodyByteLength,4);
    
    var offset = 8;
    const BodyBufferList = []
    for(let i=0;i<newCount;i++){
        newheaderArray.writeUInt32LE(ByteLengthforeachElement[i],offset);
        BodyBufferList.push(str2Buffer(newElementList[i]))
        offset +=4;
    }
    const newBodyBuffer = Buffer.concat(BodyBufferList);
    const updatedBuffer = Buffer.concat([newheaderArray,newBodyBuffer]);
    return updatedBuffer;
}

function str2Buffer(newID){
    newID +="\0" 
    var buf = new ArrayBuffer(newID.length); // 1 bytes for each char
    var bufView = new Uint8Array(buf);
    for(var i=0; i < newID.length; i++) {
        bufView[i] = newID.charCodeAt(i);
    }
    buf = Buffer.from(buf)
    return buf;
}
