const fs = require('fs');
const deleteBuild = require('../../tools-scene-editor/DeleteFromScene');

/**
 * Configuration parameters
 */
var config = JSON.parse(fs.readFileSync("./conf/conf.json"));
var AssetsBase_Scene = config['Assets'] ; 

exports.onDeleteStartUpdatei3s =  function(DeletedFromLayer,building_id,lod){
    if(lod=="1"){
        AssetsBase_Scene  += "/LOD1/I3S/"
    }
    if(lod == "2"){
        AssetsBase_Scene  += "/LOD2/I3S/"
    }
    const sceneBasePath = AssetsBase_Scene + DeletedFromLayer + "/" ;
    const allNodes = fs.readdirSync(sceneBasePath+ "nodes");

    allNodes.forEach((readnode)=>{
        if(readnode !="root"){
            deleteBuild.SceneUpdate(sceneBasePath, readnode, building_id)
        }
    })
AssetsBase_Scene = "";
}



