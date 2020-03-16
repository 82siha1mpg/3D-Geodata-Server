const fs = require('fs');
const zlib = require('zlib');
const extractCords = require('../readGeom');

exports.addbuildInScene = function(PrimaryScene,SecondaryScene){
        const GzipPrimaryNodeIndex = fs.readFileSync(PrimaryScene+"/3dNodeIndexDocument.json.gz");
        const PrimaryNodeIndex = JSON.parse(zlib.gunzipSync(GzipPrimaryNodeIndex));
        const PriMBS = PrimaryNodeIndex.mbs;

        const GzipSecNodeIndex = fs.readFileSync(SecondaryScene+"/3dNodeIndexDocument.json.gz");
        const SecNodeIndex = JSON.parse(zlib.gunzipSync(GzipSecNodeIndex));
        const SecMBS = SecNodeIndex.mbs;
        

        const GzipPrimarySceneGeom = fs.readFileSync(PrimaryScene+"/geometries/0.bin.gz");
        const GzipPrimaryScenefeature = fs.readFileSync(PrimaryScene+"/features/0.json.gz");
        const GeomPrimaryScene = zlib.gunzipSync(GzipPrimarySceneGeom);
        const JsonPrimaryScenefeature = JSON.parse(zlib.gunzipSync(GzipPrimaryScenefeature));

        const GzipSecSceneGeom = fs.readFileSync(SecondaryScene + "/geometries/0.bin.gz");
        const GzipSecSceneJSON = fs.readFileSync(SecondaryScene + "/features/0.json.gz")
        const JsonSecScenefeature = JSON.parse(zlib.gunzipSync(GzipSecSceneJSON));
        const GeomSecScene = zlib.gunzipSync(GzipSecSceneGeom);
 
        const newGeomBuffer =  MergeGeoms(GeomPrimaryScene,JsonPrimaryScenefeature, GeomSecScene, JsonSecScenefeature, PriMBS, SecMBS)

        const NewGzipGeomBuffer = zlib.gzipSync(newGeomBuffer);
        fs.writeFileSync(PrimaryScene+"/geometries/0.bin.gz", NewGzipGeomBuffer);
}

function MergeGeoms(GeomPrimaryScene,JsonPrimaryScenefeature, GeomSecScene, JsonSecScenefeature , PriMBS, SecMBS){

    /**
     * Update Header of Geometry Buffer.
     * 1. Vertex Count 4Bytes
     * 2. Feature Count 4Bytes.
     */
    const newVertexCount = Buffer.from(GeomPrimaryScene).readUInt32LE(0) + Buffer.from(GeomSecScene).readUInt32LE(0) 
    const newfeatureCount = Buffer.from(GeomPrimaryScene).readUInt32LE(4) + Buffer.from(GeomSecScene).readUInt32LE(4)
    
    const newHeaderBuffer = Buffer.alloc(8);
          newHeaderBuffer.writeUInt32LE(newVertexCount, 0);
          newHeaderBuffer.writeUInt32LE(newfeatureCount,4);

    /**
     * Update Body of Geometry Buffer
     * 1. All elements of GeomData i.e. [ "position", "normal", "uv0", "color", "region" ]
     * 2. All elements of feature data in geometry buffer i.e.  + [featureid, featurefaceRange]
     */

    const geomDataPrimary = JsonPrimaryScenefeature.geometryData[0].params;
    const geomDataSecondary = JsonSecScenefeature.geometryData[0].params;  
    
    const PriPositionBuffer = GeomPrimaryScene.slice(geomDataPrimary.vertexAttributes.position.byteOffset , geomDataPrimary.vertexAttributes.normal.byteOffset);
    const PriNormalBuffer   = GeomPrimaryScene.slice(geomDataPrimary.vertexAttributes.normal.byteOffset , geomDataPrimary.vertexAttributes.uv0.byteOffset);    
    const PriUV0Buffer      = GeomPrimaryScene.slice(geomDataPrimary.vertexAttributes.uv0.byteOffset , geomDataPrimary.vertexAttributes.color.byteOffset);
    const PricolorBuffer    = GeomPrimaryScene.slice(geomDataPrimary.vertexAttributes.color.byteOffset , geomDataPrimary.vertexAttributes.region.byteOffset);
    const PriregionBuffer   = GeomPrimaryScene.slice(geomDataPrimary.vertexAttributes.region.byteOffset , geomDataPrimary.featureAttributes.id.byteOffset);
    const PriIDBuffer       = GeomPrimaryScene.slice(geomDataPrimary.featureAttributes.id.byteOffset , geomDataPrimary.featureAttributes.faceRange.byteOffset);
    const PrifaceRangeBuffer= GeomPrimaryScene.slice(geomDataPrimary.featureAttributes.faceRange.byteOffset, GeomPrimaryScene.length );
   
    // Before Geometry is merged in the primary file, relative positions have to be updated.
   //const SecPositionBuffer = GeomSecScene.slice(geomDataSecondary.vertexAttributes.position.byteOffset , geomDataSecondary.vertexAttributes.normal.byteOffset);
   //console.log(SecPositionBuffer);
    const SecPositionBuffer = changeRelativePositions(GeomSecScene , PriMBS ,SecMBS)
    const SecNormalBuffer   = GeomSecScene.slice(geomDataSecondary.vertexAttributes.normal.byteOffset , geomDataSecondary.vertexAttributes.uv0.byteOffset);    
    const SecUV0Buffer      = GeomSecScene.slice(geomDataSecondary.vertexAttributes.uv0.byteOffset , geomDataSecondary.vertexAttributes.color.byteOffset);
    const SeccolorBuffer    = GeomSecScene.slice(geomDataSecondary.vertexAttributes.color.byteOffset , geomDataSecondary.vertexAttributes.region.byteOffset);
    const SecregionBuffer   = GeomSecScene.slice(geomDataSecondary.vertexAttributes.region.byteOffset , geomDataSecondary.featureAttributes.id.byteOffset);
    const SecIDBuffer       = GeomSecScene.slice(geomDataSecondary.featureAttributes.id.byteOffset , geomDataSecondary.featureAttributes.faceRange.byteOffset);
   // const SecIDBuffer = Buffer.alloc(8)
    //SecIDBuffer.writeBigUInt64LE(88888n,0)
    

    /**
     * facerange data from Secondary data has to be changed to the numbers matching the last count of Primary face range.
     */

    const N_elements = JsonPrimaryScenefeature.featureData.length;
    const PriFaceRangeEndElement = JsonPrimaryScenefeature.featureData[N_elements-1].geometries[0].params.faceRange[1];
    

    const SecFeacRangeJSON = JsonSecScenefeature.featureData
    const SecFacerangeBufferList = [];
    for(let i=0; i<SecFeacRangeJSON.length; i++){
        const newFaceRange0 =  SecFeacRangeJSON[i].geometries[0].params.faceRange[0] + PriFaceRangeEndElement+1;
        const newFaceRange1 = SecFeacRangeJSON[i].geometries[0].params.faceRange[1] + PriFaceRangeEndElement+1;
        
        //console.log("[", newFaceRange0, newFaceRange1, "]")
        const tempBuf = Buffer.alloc(8);
            tempBuf.writeUInt32LE( newFaceRange0, 0);
            tempBuf.writeUInt32LE( newFaceRange1, 4);
        SecFacerangeBufferList.push(tempBuf)
    }
    const SecFaceRangeBufferNEW =  Buffer.concat(SecFacerangeBufferList);

    const newBodyBuffer = Buffer.concat([
        PriPositionBuffer,SecPositionBuffer,
        PriNormalBuffer,SecNormalBuffer,
        PriUV0Buffer,SecUV0Buffer,
        PricolorBuffer,SeccolorBuffer,
        PriregionBuffer,SecregionBuffer,
        PriIDBuffer,SecIDBuffer,
        PrifaceRangeBuffer, SecFaceRangeBufferNEW
    ])

    const newGeomBuffer = Buffer.concat([newHeaderBuffer,newBodyBuffer]);
    
    return newGeomBuffer;
}

function changeRelativePositions(GeomSecScene , PriMBS ,SecMBS){

    const SecBufferPositionsOld = extractCords.extractCordsfromNode(GeomSecScene,SecMBS);
   
    const vertexCount = SecBufferPositionsOld.length;
    const tempBuffer = new ArrayBuffer(vertexCount*3*4);
    const bufferView = new Float32Array(tempBuffer, 0, vertexCount*3);
    var count = 0
    for(let i=0;i<vertexCount*3;i=i+3){
        bufferView[i] = SecBufferPositionsOld[count][0] - PriMBS[0];
        bufferView[i+1] = SecBufferPositionsOld[count][1] - PriMBS[1];
        bufferView[i+2] = SecBufferPositionsOld[count][2] - PriMBS[2];
        count+=1;   
    }
    return Buffer.from(tempBuffer)
}