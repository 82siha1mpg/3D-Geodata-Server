const fs = require('fs');
const zlib = require('zlib');

/**
 * Feature JSON will read and understand how data is stored in Geometry buffer.
 * Face Range means one triangle, which consists of 3 points
 */
exports.UpdateGeomDel = function(sceneBasePath , deleteObjectBoolean , readNode){
    //readNode = "2"
    const GzipfeatureJSON = fs.readFileSync(sceneBasePath+"/"+readNode+"/features/0.json.gz");
    const GzipGeometryBinary = fs.readFileSync(sceneBasePath+"/"+readNode+"/geometries/0.bin.gz")
    const GzipIndex = fs.readFileSync(sceneBasePath+"/"+readNode+ "/3dNodeIndexDocument.json.gz")

    const featureJSON = JSON.parse(zlib.gunzipSync(GzipfeatureJSON));
    const GeometryBinary = zlib.gunzipSync(GzipGeometryBinary);
    
    const featureFaceranges = findRanges(featureJSON.featureData); //face ranges are number of triangles.
    const geomBufferRangesDICT = findGeomdataBuffer(featureJSON.geometryData)[0];
    const geomBufferfeatureattributes = findGeomdataBuffer(featureJSON.geometryData)[1]

    const newGeomBinary  = UpdateGeombinary(GzipIndex, GeometryBinary, featureFaceranges, geomBufferRangesDICT, geomBufferfeatureattributes, deleteObjectBoolean)

    //console.log("Old Binary Length" , GeometryBinary.length)
    //console.log("New Geomtery Binary Length",newGeomBinary.length)
    const GZIPnewGeomBinary = zlib.gzipSync(newGeomBinary);
    
    fs.writeFileSync(sceneBasePath+ "/" +readNode + "/geometries/0.bin.gz", GZIPnewGeomBinary);

    //console.log(" Geom Buffer =  ", newGeomBinary.length);
   // console.log("Success in Updating Geometry Buffer!");
}

function findRanges(featuredata){
    const featureFaceranges = [];

    for(let i=0;i<featuredata.length;i++){
        featureFaceranges.push(featuredata[i]["geometries"][0]["params"]["faceRange"])  // this will fetch index of objects in buffer
    }
    return featureFaceranges
}

function findGeomdataBuffer(geomData){
    const position = geomData[0]["params"]["vertexAttributes"].position;
    const normals = geomData[0]["params"]["vertexAttributes"].normal;
    const uv0 = geomData[0]["params"]["vertexAttributes"].uv0;
    const color = geomData[0]["params"]["vertexAttributes"].color;
    const region = geomData[0]["params"]["vertexAttributes"].region;

    const geomBufferfeatureattributesID = geomData[0]["params"]["featureAttributes"].id;
    const geomBufferfeatureattributesfaceRange = geomData[0]["params"]["featureAttributes"].faceRange;
    return [{"position":position,"normals":normals,"uv0":uv0,"color":color,"region":region},
            [geomBufferfeatureattributesID, geomBufferfeatureattributesfaceRange]]
}

function UpdateGeombinary(GzipIndex, geombuffer , featureFaceranges, geomBufferRangesDICT, geomBufferfeatureattributes, deleteObjectBoolean){
    
    const vertexCount = Buffer.from(geombuffer).readUInt32LE(0) //header
    const featureCount = Buffer.from(geombuffer).readUInt32LE(4) //header

    var deletefeatureCount = 0;
    var deleteFaceCount = 0;

    const positionBuffer = sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRangesDICT["position"]);
    const normalBuffer = sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRangesDICT["normals"]);
    const uv0Buffer = sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRangesDICT["uv0"]);
    const colorBuffer = sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRangesDICT["color"]);
    const regionBuffer = sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRangesDICT["region"]);
    //console.log(geomBufferfeatureattributes)
    const oldBodyBufferFooter = geombuffer.slice(geomBufferfeatureattributes[0]["byteOffset"], geombuffer.length );

    const newpositionBuffer = [];
    const newNormalBuffer = [];
    const newuv0Buffer = [];
    const newcolorBuffer = [];
    const newregionBuffer = [];

    for(let i=0;i<featureCount;i++){
        if(deleteObjectBoolean[i]==0){
            newpositionBuffer.push(positionBuffer[i])
            newNormalBuffer.push(normalBuffer[i])
            newuv0Buffer.push(uv0Buffer[i])
            newcolorBuffer.push(colorBuffer[i])
            newregionBuffer.push(regionBuffer[i])
        }
        else{
            deletefeatureCount += deleteObjectBoolean[i]; 
            deleteFaceCount += ((featureFaceranges[i][1]+1) - featureFaceranges[i][0])  
        }
    }
    
    /*const checkPos = Buffer.concat(newpositionBuffer)
    console.log(checkPos.length)
    
    const indexJSON = JSON.parse(zlib.gunzipSync(GzipIndex));
    const relPosition = indexJSON.mbs;
    for(let i=0; i<checkPos.length; i=i+12){
            const x = Buffer.from(checkPos).readFloatLE(i)
            const y = Buffer.from(checkPos).readFloatLE(i+4)
            const z= Buffer.from(checkPos).readFloatLE(i+8)
            const strpos = ((relPosition[1]+y).toString()+","+(relPosition[0]+x).toString()+","+(relPosition[2]+z).toString())
            console.log(strpos)
        } */
   /* 
    console.log("newpositionBuffer length", newpositionBuffer[0].length + newpositionBuffer[1].length)
    console.log("normal length", newNormalBuffer[0].length + newNormalBuffer[1].length)
    console.log("uv0 length", newuv0Buffer[0].length + newuv0Buffer[1].length)
    console.log("color length", newcolorBuffer[0].length + newcolorBuffer[1].length)
    console.log("region length", newregionBuffer[0].length + newregionBuffer[1].length)
    */

    const newBodyBufferWithoutFooter = Buffer.concat(newpositionBuffer.concat(newNormalBuffer,newuv0Buffer,newcolorBuffer,newregionBuffer))
    
    const newBodyBuffer = updateGeomBodyBuffer(newBodyBufferWithoutFooter, oldBodyBufferFooter , deleteObjectBoolean , geomBufferfeatureattributes)

    //console.log("body and footer lengths", newBodyBufferWithoutFooter.length, newBodyBuffer.length)
    const deleteVertexCount  = deleteFaceCount * 3;
    
    const newVertexCount = vertexCount - deleteVertexCount
    const newfeatureCount = featureCount - deletefeatureCount
    
    const headerBuffer = new Buffer.alloc(8);
    headerBuffer.writeUInt32LE( newVertexCount , 0)
    headerBuffer.writeUInt32LE( newfeatureCount , 4)
    console.log(newVertexCount)
    //console.log(newfeatureCount)
    const newGeomBuffer = Buffer.concat([headerBuffer,newBodyBuffer])

    //console.log("Feature Count", newfeatureCount)
    return newGeomBuffer
    
}

function sliceGeomDataBuffer(geombuffer,featureCount, featureFaceranges, geomBufferRange){
    /**
     * feature face range means number of triangles 
     * which further contains 3 points.
     * total byte size for position buffer of one face is 3*4*3 = 36 Bytes
     * total byte size for normals buffer of one face is 3*4*3 = 36 Bytes
     * total byte size for uv0 buffer of one face is 3*4*2 = 24 Bytes
     * total byte size for colors buffer of one face is 3*1*4 = 12 Bytes
     * total byte size for uv0 buffer of one face is 3*4*2 = 24Bytes
     * total byte size for region buffer of one face is 3*2*4 = 24Bytes
     */
    const type = geomBufferRange.valueType;
    const elements = geomBufferRange.valuesPerElement;
    const bufferSliced = [];

    // for position and normal, size is 3*4*3
    if(type == "Float32" && elements == 3){
        for(let i=0;i<featureCount;i++){
            const startOffset = geomBufferRange.byteOffset + (featureFaceranges[i][0] * (3*4*3));
            const endOffset =  geomBufferRange.byteOffset +  (featureFaceranges[i][1]+1) * (3*4*3);
           // console.log(startOffset -8 , endOffset -8)
            bufferSliced.push(geombuffer.slice(startOffset, endOffset));
        }       
    }
    // for uv0, size is 3*4*2
    if(type == "Float32" && elements == 2){
        for(let i=0;i<featureCount;i++){
            const startOffset = geomBufferRange.byteOffset + (featureFaceranges[i][0] * (3*4*2));
            const endOffset =  geomBufferRange.byteOffset +  (featureFaceranges[i][1]+1) * (3*4*2);
            bufferSliced.push(geombuffer.slice(startOffset, endOffset));
        }       
    }
    // for color, size is 3*1*4
    if(type == "UInt8" && elements == 4){
        for(let i=0;i<featureCount;i++){
            const startOffset = geomBufferRange.byteOffset + (featureFaceranges[i][0] * (3*1*4));
            const endOffset =  geomBufferRange.byteOffset +  (featureFaceranges[i][1]+1) * (3*1*4);
            bufferSliced.push(geombuffer.slice(startOffset, endOffset));
        }       
    }
     // for region, size is 3*1*4
     if(type == "UInt16" && elements == 4){
        for(let i=0;i<featureCount;i++){
            const startOffset = geomBufferRange.byteOffset + (featureFaceranges[i][0] * (3*2*4));
            const endOffset =  geomBufferRange.byteOffset +  (featureFaceranges[i][1]+1) * (3*2*4);
            bufferSliced.push(geombuffer.slice(startOffset, endOffset));
        }       
    }
    return bufferSliced;
}

function updateGeomBodyBuffer(newBodyBufferWithoutFooter, oldBodyBufferFooter , deleteObjectBoolean , geomBufferfeatureattributes){
    //console.log(newBodyBufferWithoutFooter.length)
    //console.log(geomBufferfeatureattributes)
    const featureIdType = geomBufferfeatureattributes[0].valueType
    const featureIdElements =  geomBufferfeatureattributes[0].valuesPerElement
    const featureFaceRangesType = geomBufferfeatureattributes[1].valueType
   // const featureFacerangesElements =  geomBufferfeatureattributes[1].valuesPerElement
    const count = deleteObjectBoolean.length 

    var offset = 0;
    const reqIDBuffers = [];
    const reqRangeBuffers = [];
    var deleted = 0;

    if(featureIdType == "UInt64" && featureFaceRangesType == "UInt32"){
        const featureIDfromFooter = oldBodyBufferFooter.slice(0, count * featureIdElements * 8)
        const featureFaceRangefromFooter = oldBodyBufferFooter.slice(count * featureIdElements * 8 , oldBodyBufferFooter.length )
        
        for(let i=0;i <= count ;i++){
            //console.log("u",i)
            if(i>0){
                //console.log("i-1",i-1)
                if(deleteObjectBoolean[i-1] == 0){
                    reqIDBuffers.push(featureIDfromFooter.slice(offset,offset+8))
                    
                    const newfacerange1 = Buffer.from(featureFaceRangefromFooter).readUInt32LE(offset)-deleted;
                    const newfacerange2 = Buffer.from(featureFaceRangefromFooter).readUInt32LE(offset+4)-deleted;
                   // console.log(deleteObjectBoolean[i-1])

                    const newfacerangebuffer =new Buffer.alloc(8) 
                    newfacerangebuffer.writeUInt32LE(newfacerange1,0)
                    newfacerangebuffer.writeUInt32LE(newfacerange2,4)

                   // console.log("Face Range start", Buffer.from(newfacerangebuffer).readUInt32LE(0))
                   // console.log("Face Range end", Buffer.from(newfacerangebuffer).readUInt32LE(4))
                    reqRangeBuffers.push(newfacerangebuffer)
                }
            offset += 8
            }
           //console.log(offset)
            if(deleteObjectBoolean[i] == 1 && i<count){
               // console.log("offset", offset)
                deleted +=  Buffer.from(featureFaceRangefromFooter).readUInt32LE(offset+4) - Buffer.from(featureFaceRangefromFooter).readUInt32LE(offset)+1
                //console.log("deleted : ", deleted)
            }
            
        }
    }
    
    const rangeBuffer  = Buffer.concat(reqRangeBuffers)
    const reqIDBuffer = Buffer.concat(reqIDBuffers)

    //console.log("Body without footer", newBodyBufferWithoutFooter.length)
    //console.log("id buffer length", reqIDBuffer.length);
    //console.log("range buffer length", rangeBuffer.length);

    const updatedGeomBuffer = Buffer.concat([newBodyBufferWithoutFooter,reqIDBuffer,rangeBuffer])
    return updatedGeomBuffer
}