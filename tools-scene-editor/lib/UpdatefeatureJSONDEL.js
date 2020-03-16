const fs = require('fs');
const zlib = require('zlib');


/**
 * Feature JSON will read and understand how data is stored in Geometry buffer.
 * Face Range means one triangle, which consists of 3 points
 */
exports.UpdatefeatureJSONDel = function(sceneBasePath , deleteObjectBoolean , readNode){
    //readNode = "2"
     const GzipfeatureJSON = fs.readFileSync(sceneBasePath+"/"+readNode+"/features/0.json.gz");
     const oldfeatureJSON = JSON.parse(zlib.gunzipSync(GzipfeatureJSON));
     const returnedFeatureJsonData = updatefeatureDataJSON(oldfeatureJSON.featureData, deleteObjectBoolean)
     const newFeatureDataJSONlist = returnedFeatureJsonData[0]
     const featureCount = returnedFeatureJsonData[1]

     //console.log(newFeatureDataJSONlist[16].geometries[0].params.faceRange)
     //console.log(featureCount)
    const newGeometryDataJSONlist = updateGeometryDataJSON(oldfeatureJSON.geometryData, newFeatureDataJSONlist, featureCount)

    const newJSON = {}
    newJSON["featureData"] = newFeatureDataJSONlist;
    newJSON["geometryData"] = newGeometryDataJSONlist;
    
    //console.log("length of New feature data",newJSON["featureData"].length)
   // console.log(newJSON)
    newJSONBuffer =  Buffer.from(JSON.stringify(newJSON),'utf8');

    const GZIPnewJSON = zlib.gzipSync(newJSONBuffer);
    
   fs.writeFileSync(sceneBasePath+"/"+readNode+"/features/0.json.gz", GZIPnewJSON);
   //console.log("Feature JSON Updated successfully")
    
}
function updatefeatureDataJSON(featureData , deleteObjectBoolean ){
    const featureDatalist = [];
    var deleted = 0;
    var featureCount = 0;
   // console.log(featureData)
   // console.log(deleteObjectBoolean)
    for(let i =0;i<= deleteObjectBoolean.length;i++){
        if(i>0 && deleteObjectBoolean[i-1]==0){
           // console.log(featureData[i-1]["geometries"])
           featureData[i-1]["geometries"][0]["params"]["faceRange"][0] -= deleted
           featureData[i-1]["geometries"][0]["params"]["faceRange"][1] -= deleted
           //console.log(featureData[i-1]["geometries"][0]["params"])
           featureDatalist.push(featureData[i-1])
           featureCount += 1;
        }
        if(deleteObjectBoolean[i]== 1 && i<deleteObjectBoolean.length ){
            deleted +=  featureData[i]["geometries"][0]["params"]["faceRange"][1] - featureData[i]["geometries"][0]["params"]["faceRange"][0] + 1 
        }   
    }
    return [featureDatalist,featureCount]
}

function updateGeometryDataJSON(geomData, featureData, featureCount){
    /**
     * Count is 3 times face Range
     */
    
    const lastElementinFeatureData = featureData.length -1;
    var newCount = 0;
    if(featureData.length !=0 && featureCount !=0){
        newCount = (featureData[lastElementinFeatureData]["geometries"][0]["params"]["faceRange"][1] + 1) *3 ; // count is 3 times faceranges. faceranges are trainagles and count is number of points.
    }
    
   // console.log(newCount) 

    geomData[0]["params"]["vertexAttributes"]["position"]["count"] = newCount ;
    const positionbyteOffset = geomData[0]["params"]["vertexAttributes"]["position"]["byteOffset"];
    
    geomData[0]["params"]["vertexAttributes"]["normal"]["byteOffset"] = newCount * 4 * 3 + positionbyteOffset  ;
    geomData[0]["params"]["vertexAttributes"]["normal"]["count"] = newCount ;
    const normalbyteOffset = geomData[0]["params"]["vertexAttributes"]["normal"]["byteOffset"]; 

    geomData[0]["params"]["vertexAttributes"]["uv0"]["byteOffset"] = newCount * 4 * 3 + normalbyteOffset  ;
    geomData[0]["params"]["vertexAttributes"]["uv0"]["count"] = newCount ;
    const uv0byteOffset = geomData[0]["params"]["vertexAttributes"]["uv0"]["byteOffset"]; 

    geomData[0]["params"]["vertexAttributes"]["color"]["byteOffset"] = newCount * 4 * 2 + uv0byteOffset  ;
    geomData[0]["params"]["vertexAttributes"]["color"]["count"] = newCount ;
    const colorbyteOffset = geomData[0]["params"]["vertexAttributes"]["color"]["byteOffset"]; 

    geomData[0]["params"]["vertexAttributes"]["region"]["byteOffset"] = newCount * 1 * 4 + colorbyteOffset  ;
    geomData[0]["params"]["vertexAttributes"]["region"]["count"] = newCount ;
    const regionbyteOffset = geomData[0]["params"]["vertexAttributes"]["region"]["byteOffset"]; 

    
    geomData[0]["params"]["featureAttributes"]["id"]["byteOffset"] = newCount * 2 * 4 + regionbyteOffset  ;
    geomData[0]["params"]["featureAttributes"]["id"]["count"] = featureCount ;
    const featureidByteOffset = geomData[0]["params"]["featureAttributes"]["id"]["byteOffset"] ;
    
    geomData[0]["params"]["featureAttributes"]["faceRange"]["byteOffset"] = featureCount * 8 * 1 + featureidByteOffset  ;
    geomData[0]["params"]["featureAttributes"]["faceRange"]["count"] = featureCount ;
    
    return geomData;
}