var Cesium = require('cesium');
//var turf = require('turf');
var turf_contain = require("@turf/turf");
const fs = require('fs');

function boundvoume2box(vol){
  //  console.log(vol);
    const centre = vol.slice(0,3);
    const x_direc = vol.slice(3,6);
    const y_direc = vol.slice(6,9);
    const z_direc = vol.slice(9,12);
    const extent = [
                    centre[0]+x_direc[0],centre[1]-y_direc[1],centre[2]-z_direc[2] // x,y,z lc of box
                    ,centre[0]-x_direc[0],centre[1]+y_direc[1],centre[2]-z_direc[2] // x,y,z uc of box
                    ];
    return extent
}
function extent2degree(extent){
    
    const lc = new Cesium.Cartesian3(extent[0],extent[1],extent[2]); // lower corner extent X Y Z in cartesian 
    const cartographic_lc = Cesium.Cartographic.fromCartesian(lc);  //
    
    const long_lc = Cesium.Math.toDegrees(cartographic_lc.longitude);
    const lat_lc = Cesium.Math.toDegrees(cartographic_lc.latitude);
    //const z_lc = Cesium.Math.toDegrees(cartographic_lc.height);
    
    const uc = new Cesium.Cartesian3(extent[3],extent[4],extent[5]);
    const cartographic_uc = Cesium.Cartographic.fromCartesian(uc);
    const long_uc = Cesium.Math.toDegrees(cartographic_uc.longitude);
    const lat_uc = Cesium.Math.toDegrees(cartographic_uc.latitude);
   // const z_uc = Cesium.Math.toDegrees(cartographic_uc.height);
    const extent_degrees = new Array(long_lc,lat_lc,long_uc,lat_uc);  // 2d box is returned
    return extent_degrees;
}


 var count;
 exports.newJSON  = function(tileset,client_box,temp_JSON_Path){
  var root = tileset["root"];
  var emptyJSON = new Array;
  var child_json = new Array;
  count = 0;
  child_json = traverse(root,client_box,emptyJSON);
// we will now check only children of root nodes. for full containment ...
// obj here is 3dtile that has to be passed along with client box in order to traverse through the json object.
  var new_JSON = tileset;
  //console.log(child_json[0]);
    new_JSON["root"]["boundingVolume"]=child_json[0]["boundingVolume"];
    // new_JSON["root"]["geometricError"]=child_json[0]["geometricError"];
  
    new_JSON["root"]["content"]=child_json[0]["content"];
    new_JSON["root"]["children"] = child_json;
  //console.log(new_JSON);
  
  fs.writeFileSync(temp_JSON_Path,JSON.stringify(new_JSON));
  //return new_JSON;
} ;

  function traverse(obj,client_box,emptyJSON){
  
  if( obj !== null && typeof obj == "object") {
      Object.entries(obj).forEach(([key, value]) => {
    //enter all children nodes
    //and check BBOX and move to next child
    //important is to find number of child nodes for each parent node.
    //value here means data inside the associated key. {key:value}
      if(key=="children"){ 
        const n = Object.keys(value).length;  //find number of child nodes.
        
        for(var i=0;i<n;i++)
        {
    //console.log(value[i.toString()]["content"]["url"]);
          var bbox = boundvoume2box(value[i.toString()]["content"]["boundingVolume"]["box"]); // bounding bbox of ith childeren on nth level 
          var extent_tile_deg = extent2degree(bbox); //convert that box of child node to degree.
    //console.log(extent_tile);
          var extent_tile_poly = turf_contain.bboxPolygon(extent_tile_deg);    //box extent is then concverted to geojson turf polygon object.
    //console.log(extent_tile_poly);
          
          var extent_client_box = turf_contain.bboxPolygon(client_box);
          var check_inside = turf_contain.booleanContains(extent_client_box,extent_tile_poly);
    
     //if child node is completely within the client drawn box.
     
            if (check_inside==true)
            {
              if(value[i.toString()]["geometricError"] != undefined){
      emptyJSON[count] = { "boundingVolume":value[i.toString()]["boundingVolume"]
                            ,"geometricError":value[i.toString()]["geometricError"]
                            ,"refine":value[i.toString()]["refine"]
                            ,"content":value[i.toString()]["content"]
                          };
                      }
                      else{
                        emptyJSON[count] = { "boundingVolume":value[i.toString()]["boundingVolume"]
                            ,"refine":value[i.toString()]["refine"]
                            ,"content":value[i.toString()]["content"]
                          };
                      }
      count++;
            }

        }     
      }
      traverse(value,client_box,emptyJSON);
    })
  }
 // console.log(count,"number of objects falls within the box");
  return emptyJSON;
}