const turf_contain = require("@turf/turf");
const Cesium = require('cesium');

exports.ValidAdd= function(pri_b3dm,sec_b3dm){
    
    var pri_bufferGlb = new Uint8Array(pri_b3dm.glb); 
    var sec_bufferGlb = new Uint8Array(sec_b3dm.glb);

    const BBOXPrimary = fetchBBOX(pri_bufferGlb);
    const BBOXSecondary = fetchBBOX(sec_bufferGlb);
    if(BBOXPrimary !=undefined){
        validity = checkContainment(BBOXPrimary,BBOXSecondary);
        return validity;
    }
    else{
        return false;
    }
    
}

function makeGLBJson(b3dmbuffer){
   // console.log(b3dmbuffer)
    const JsonLen = Buffer.from(b3dmbuffer.slice(12,16),"hex").readUInt32LE(0)
    // GLB Header 20 Bytes.
    const glb_JSONBuffer = b3dmbuffer.slice(20,(JsonLen+20)); // 20 is added because in glb header, 0-20 bytes are showing the information of the content. So after reading the length of JSON, 20 is added more to extract actual Json and update it.
    const glb_JSONString = Buffer.from(glb_JSONBuffer,"hex");
    
    var glbJSON = ""  
    for(let i = 0; i< glb_JSONString.length; i++) 
        {
            const more_words = glb_JSONString.slice(i,i+1).toString();
            glbJSON = glbJSON.concat(more_words)
        }
    //console.log(glbJSON)
    return glbJSON; 
}

function checkContainment(BBOXPrimary,BBOXSecondary){
    const fully_contained = turf_contain.booleanContains(BBOXPrimary,BBOXSecondary);
    if(fully_contained == true) {
        return true;
    }
    else return false;
} 

function fetchBBOX(bufferGlb){
    var cordsXY = [];  //[[x1,y1],[x2,y2]...]
    
    const GLBJson = JSON.parse(makeGLBJson(bufferGlb));
    const JSONLen = Buffer.from(bufferGlb.slice(12,16),"hex").readUInt32LE(0)

    const RTCCenter = GLBJson["extensions"]["CESIUM_RTC"]["center"];
    if(GLBJson["bufferViews"].length !=0){
        var BinaryGLB = bufferGlb.slice((20+JSONLen+8),bufferGlb.length); //Slices on the binary object out of GltF
        var PositionBuffer = BinaryGLB.slice(GLBJson["bufferViews"][0]["byteOffset"],GLBJson["bufferViews"][1]["byteOffset"]);
        for(let i = 0; i< PositionBuffer.length; i = i+12) // XYZ three points takes 12 Bytes.
            {
                const pos_x =  Buffer.from(PositionBuffer,'hex').readFloatLE(i);   
                const pos_z =  Buffer.from(PositionBuffer,'hex').readFloatLE(i+4);  
                const pos_y = Buffer.from(PositionBuffer,'hex').readFloatLE(i+8) ;
                
                const cartX =  pos_x + RTCCenter[0] ;
                const cartZ =  pos_z + RTCCenter[2] ; 
                const cartY = -pos_y + RTCCenter[1] ;

                
                const cartesianCord = [cartX,cartY,cartZ]; 
                const cart = new Cesium.Cartesian3(cartesianCord[0],cartesianCord[1],cartesianCord[2]) //XYZ
                const cartographicCord = Cesium.Cartographic.fromCartesian(cart);
                const lon = Cesium.Math.toDegrees(cartographicCord.longitude);
                const lat = Cesium.Math.toDegrees(cartographicCord.latitude);
                
                cordsXY.push([lon , lat]);
            }
        var line = turf_contain.lineString(cordsXY);
        var bbox = turf_contain.bbox(line);
        var bboxPolygon = turf_contain.bboxPolygon(bbox);
        return bboxPolygon;
    }
    else{
        return undefined
    }
}