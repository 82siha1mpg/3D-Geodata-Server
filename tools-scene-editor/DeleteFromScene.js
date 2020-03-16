const fs = require('fs');
const zlib = require('zlib');

const UpdateAttributes = require('./lib/UpdateAttribDEL')
const UpdateGeom = require('./lib/UpdateGeomDel')
const UpdateFeatureJSON = require('./lib/UpdatefeatureJSONDEL')
/**
 * NODES
 * --0
 * ---features: this folder contains JSON. In this JSON, Geometry Buffer's properties are defined. Read it to parse binary buffer.
 * ---geometry: this folder contains binary buffer.
 * ---attributes: It contains the buffers of the attribute data. It is used to find out GMl ID.
 */

//const sceneBasePath = "./scenes/LGL/";
//const deleteGMLID = "DEBW_0010004GHQo"
//SceneUpdate(sceneBasePath,deleteGMLID);
 
exports.SceneUpdate = function(sceneBasePath, readNode, deleteGMLID){
    const scenelayerGZIP = fs.readFileSync(sceneBasePath+"/3dSceneLayer.json.gz");
    const scenelayerJSON = JSON.parse(zlib.gunzipSync(scenelayerGZIP));
    const fields = findfields(scenelayerJSON["popupInfo"]);

    const deleteObjectBoolean = UpdateAttributes.UpdateAttributesDel(sceneBasePath+'nodes/' , fields, deleteGMLID , readNode); // this is overwriting exisitng attribute buffers and returning Delete Boolean data. 
    
    const sumfunc = deleteObjectBoolean => deleteObjectBoolean.reduce((total,crrVal) => total + crrVal, 0);
    const sumDelete= sumfunc(deleteObjectBoolean);
    // this will ensure if there is no attribute matching to the building id, then nothing will be changed in the models.
    if(sumDelete>0){
        UpdateGeom.UpdateGeomDel(sceneBasePath+'nodes/' , deleteObjectBoolean , readNode); // it is updating the geometry binary.
        UpdateFeatureJSON.UpdatefeatureJSONDel(sceneBasePath+'nodes/' , deleteObjectBoolean, readNode);
    }
   /*  else{
        console.log("No Building found in", readNode , " Node.")
    } */
}

function findfields(popupInfo){ 
    const fieldList = [];
    for(let i =0;i< popupInfo["fieldInfos"].length; i++){
        if(popupInfo.fieldInfos[i].fieldName == 'gml_id' || popupInfo.fieldInfos[i].fieldName == 'gml_parent_id'){
            fieldList.push("f_"+i)
        }
    }
    return fieldList;
}