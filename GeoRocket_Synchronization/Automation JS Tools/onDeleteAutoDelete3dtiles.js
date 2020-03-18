const fs = require('fs');
const deleteBuild = require('../../tools-tiles-editor/deleteBuilding_from_b3dm');
var recursive = require('recursive-readdir');

/**
 * Configuration parameters
 */
var config = JSON.parse(fs.readFileSync("./conf/conf.json"));
var AssetsBase_Tile = config['Assets'] ; 

exports.onDeleteStartUpdate3dtiles = function(DeletedFromLayer,building_id,lod){
    if(lod=="1"){
        AssetsBase_Tile  += "/LOD1/3DTiles/"
    }
    if(lod=="2"){
        AssetsBase_Tile  += "/LOD2/3DTiles/"
    }
    var filesList  = [];
    const find_b3dms_inFolder = AssetsBase_Tile + DeletedFromLayer + "/tileset";
      recursive(find_b3dms_inFolder, ["*.json"], function (err, files) {
        if(err) throw err;
        
        for (let i=0;i<files.length;i++){
            filesList.push(files)
            const path_b3dm = files[i];
            //console.log(path_b3dm)
            const outputFilePath = path_b3dm;
            //console.log(building_id)
            deleteBuild.delete_buildings(path_b3dm,building_id,outputFilePath);
        }
       
    });  
AssetsBase_Tile = "";
}



