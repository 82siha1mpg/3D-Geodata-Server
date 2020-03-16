const fsExtra = require('fs-extra');
var extractB3dm = require('./lib/extractB3dm');
const Buffer = require('buffer').Buffer;
const Update_batch = require('./Update_BatchTable');
const Update_feature = require('./Update_featureTable');
const writeb3dm = require('./createB3dm');
const checkAddisValid = require('./CheckAdd_buildingsFallsInside');
const readBuffer = require('./readBuffer34');
/*  ____Update B3dm here____
1. extract binary to fetch data out of the binary b3dm.
2. Then either call Add or Remove buildings using read binary buffer.
*/
 /* const path_pri = './GML Update test/Bonn/data0.b3dm';
 const path_sec = './GML Update test/1Object/tileset/data/data0.b3dm';
 const results = './GML Update test/ADD_Results/data0.b3dm';
 forceAdd = true ;
 update_add(path_pri , path_sec , results , forceAdd) */

/**
 * 
 * @param {*File path to the primary B3dm file in which buildings has to be added.} b3dm_path 
 * @param {*File path to the secondary B3dm file in which buildings has to be added} b3dm_to_add 
 * @param {* Path with File name to save B3dm} file_path_name 
 */

exports.update_add = function(b3dm_path,b3dm_to_add,file_path_name,forceAdd=false){
    
    var buildingsFallsinside ;
    //console.log(forceAdd);
    var pri_b3dm = extract_binary(b3dm_path);
    var sec_b3dm = extract_binary(b3dm_to_add);

    if(forceAdd == false){
       
        buildingsFallsinside = checkAddisValid.ValidAdd(pri_b3dm,sec_b3dm);
        
    }
    else{
        //forcely tell algorithm that building is inside and add anyway building to the primary tileset.
        buildingsFallsinside = true; 
    }
    //console.log(buildingsFallsinside);

    // buildingsFallsinside, if building to be added is not inside the tile, then it will not be added to that tile level. 
    if(buildingsFallsinside == true){
        const added_buildings_in_GLB = add_buildings(pri_b3dm,sec_b3dm); //adding geom in GLB
        const Updated_Batch = Update_batch.update_batchTable(pri_b3dm.batchTable,sec_b3dm.batchTable);
        const Updated_feature = Update_feature.update_featureTable(pri_b3dm.featureTable,sec_b3dm.featureTable);

        writeb3dm.createB3dm(pri_b3dm.batchTable.binary, Updated_feature,Updated_Batch,added_buildings_in_GLB,file_path_name);
        //console.log("added Successfully!");
        return "added"
    }
    else{
      //  const skippedmodel = b3dm_path.split('/');
       // console.log("Null added to tileset:",skippedmodel[skippedmodel.length-1]);
       return "pending"
    }
}

function extract_binary(dir_path_b3dm){
    const b3dm_data = fsExtra.readFileSync(dir_path_b3dm);
    const b3dm = extractB3dm(b3dm_data);
    return b3dm;
}


function add_buildings(pri_b3dm,sec_b3dm){
    /**
     * It extracts GLB buffer from B3DM and updates it.
     */
   // fsExtra.writeFileSync('./GML Update test/ADD_Results/Bonn.glb',pri_b3dm.glb);
   // fsExtra.writeFileSync('./GML Update test/ADD_Results/1Object.glb',sec_b3dm.glb);
    var b3dm_buffer_glb = new Uint8Array(pri_b3dm.glb); 
    var b3dm_buffer_glb_add = new Uint8Array(sec_b3dm.glb);
    const added_building_in_GLB = update_glb(b3dm_buffer_glb,b3dm_buffer_glb_add);
    return added_building_in_GLB;
}

function update_glb(b3dm_buffer_glb , b3dm_buffer_glb_add){
    /**
     * 1. This function will first read and parse JSON files
     * 2. Then, Update GLB Json and Binary will be called.
     * 3. Both will be again concatenated and GLB will be written again.
     */
    const pri_json_len = Buffer.from(b3dm_buffer_glb.slice(12,16),"hex").readUInt32LE(0)
    const glb_header_pri = b3dm_buffer_glb.slice(0,20);
    const glb_header_primary_JSON = b3dm_buffer_glb.slice(20,(pri_json_len+20)); // 20 is added because in glb header, 0-20 bytes are showing the information of the content. So after reading the length of JSON, 20 is added more to extract actual Json and update it.
    const glb_pri_header_after_json_8bytes = b3dm_buffer_glb.slice((pri_json_len+20),(pri_json_len+20+8));

    const glbheader_primary_JSON_string = Buffer.from(glb_header_primary_JSON,"hex");
    
    var pri_glb_json = ""
    var sec_glb_json = ""
    
    for(let i = 0; i< glbheader_primary_JSON_string.length; i++) 
        {
            const more_words = glbheader_primary_JSON_string.slice(i,i+1).toString();
            pri_glb_json = pri_glb_json.concat(more_words)
        } 
        
    var sec_json_len = Buffer.from(b3dm_buffer_glb_add.slice(12,16),"hex").readUInt32LE(0);
    //var glb_header_sec = b3dm_buffer_glb_add.slice(0,20);
    var header_secondary = b3dm_buffer_glb_add.slice(20,(sec_json_len+20));
    //var glb_sec_header_after_json_8bytes = b3dm_buffer_glb_add.slice((sec_json_len+20),(sec_json_len+20+8));
    var header_secondary_string = Buffer.from(header_secondary,"hex");
    for(let i = 0; i< header_secondary_string.length; i++) 
        {
        const more_words = header_secondary_string.slice(i,i+1).toString();
        sec_glb_json = sec_glb_json.concat(more_words)
        }  

    pri_glb_json = JSON.parse(pri_glb_json);
    sec_glb_json = JSON.parse(sec_glb_json);
     
    /**
     * Now, update of binary files will be taking place.
     */
    
    var bin_pri = b3dm_buffer_glb.slice((20+pri_json_len+8),b3dm_buffer_glb.length);
    
    /**
     * pri_glb_json["bufferViews"][0]["byteOffset"] -- go to gltf json to better understand.
     * This is basically to slice the binary as per the length of bytes of data in each buffer view.
     * Begining of buffer0 and buffer1 will be one object.
     * so, split this binary object and insert new objects.
     */
    /**
     * Buffer View 1 = Position Vector " Pos has to be updated in case two binaries have to merged."
     * Buffer View 2 = Normal vector
     * Buffer View 3 = Min Max for number of objects
     * Buffer View 4 = Mix Max for Number of vertices/triangles.
     */
    var bin_pri_bufView1 = bin_pri.slice(pri_glb_json["bufferViews"][0]["byteOffset"],pri_glb_json["bufferViews"][1]["byteOffset"])
    var bin_pri_bufView2 = bin_pri.slice(pri_glb_json["bufferViews"][1]["byteOffset"],pri_glb_json["bufferViews"][2]["byteOffset"])
    var bin_pri_bufView3 = bin_pri.slice(pri_glb_json["bufferViews"][2]["byteOffset"],pri_glb_json["bufferViews"][3]["byteOffset"])
    var bin_pri_bufView4 = bin_pri.slice(pri_glb_json["bufferViews"][3]["byteOffset"], bin_pri.length) // length of last object will be byteOffset till the end of file.
    
    // Repeating same thing for second binary file.
        var bin_sec = b3dm_buffer_glb_add.slice((20+sec_json_len+8),b3dm_buffer_glb_add.length);

        var bin_sec_bufView1 = bin_sec.slice(sec_glb_json["bufferViews"][0]["byteOffset"],sec_glb_json["bufferViews"][1]["byteOffset"]);
        var bin_sec_bufView2 = bin_sec.slice(sec_glb_json["bufferViews"][1]["byteOffset"],sec_glb_json["bufferViews"][2]["byteOffset"]);
        var bin_sec_bufView3 = bin_sec.slice(sec_glb_json["bufferViews"][2]["byteOffset"],sec_glb_json["bufferViews"][3]["byteOffset"]);
        var bin_sec_bufView4 = bin_sec.slice(sec_glb_json["bufferViews"][3]["byteOffset"],bin_sec.length);
        /**
         * update position, index, range buffers. 
         * Normal vector is nt changed.
         */
        bin_sec_bufView1 = change_position_sec(pri_glb_json["extensions"]["CESIUM_RTC"]["center"],sec_glb_json["extensions"]["CESIUM_RTC"]["center"],bin_sec_bufView1); // this function intend to calculate difference of positions and update it.// position of buildings are updated to merge it in binary number 1.

        pri_bufView3ComponentType = pri_glb_json["accessors"][2]["componentType"];
        sec_bufView3ComponentType = sec_glb_json["accessors"][2]["componentType"];
        
        bin_sec_bufView3 = change_bufferView(3 , bin_pri_bufView3, pri_bufView3ComponentType, bin_sec_bufView3, sec_bufView3ComponentType);

        pri_bufView4ComponentType = pri_glb_json["accessors"][3]["componentType"];
        sec_bufView4ComponentType = sec_glb_json["accessors"][3]["componentType"];
        
       bin_sec_bufView4 = change_bufferView(4 , bin_pri_bufView4, pri_bufView4ComponentType , bin_sec_bufView4, sec_bufView4ComponentType);

        /**  
         * * Updated_buf is without GLTF JSON on the top. 
         * To make the Updation of GLB, JSON has to edited and merged.
         * position -1 ,  position-2   ,  normal vector -1 , normal vector-2 , object numbers -1 , object numbers -2 , min-max count-1, min max-count-2
         */


        const updated_buf = Buffer.concat([ bin_pri_bufView1, bin_sec_bufView1, bin_pri_bufView2, bin_sec_bufView2, bin_pri_bufView3, bin_sec_bufView3, bin_pri_bufView4, bin_sec_bufView4]);
    
        updated_min_maxList = updated_min_max(Buffer.concat([bin_pri_bufView1,bin_sec_bufView1]),Buffer.concat([bin_pri_bufView2,bin_sec_bufView2])); //buffers will be read to give new min max pos and normals.
        const updated_GLB_JSON = update_glb_json(pri_glb_json,sec_glb_json,updated_min_maxList);
        const Updated_GLB =  create_new_GLB(glb_header_pri,updated_GLB_JSON,updated_buf,glb_pri_header_after_json_8bytes);

       // fsExtra.writeFileSync('./GML Update test/ADD_Results/Updated.glb', Updated_GLB );
        
        return Updated_GLB;
}


function change_position_sec(pri_centre,sec_centre, pos_buffer){
    /**
     * RTC Center: [0 1 2], where 0 belongs to x, 1 belongs to y and 2 belongs to z. 
     * CartesianX =  RelativePosition_x + RTCCenter[0] ;
     * CartesianZ =  RelativePosition_z + RTCCenter[2] ; 
     * CartesianY = -RelativePosition_y + RTCCenter[1] ;
     * Cartesian XYZ are stored in 4 Bytes Little Endian Float in Binary GlTF.
     */
    const diff = [pri_centre[0]-sec_centre[0],sec_centre[1]-pri_centre[1],pri_centre[2]-sec_centre[2]]; 
    const new_buffer_pos_sec = new Buffer.alloc(pos_buffer.length);
    var byteOffset = 0;
    for(let i = 0; i< pos_buffer.length; i = i+12) // XYZ three points takes 12 Bytes.
        {
            const pos_x = Buffer.from(pos_buffer,'hex').readFloatLE(i)-(diff[0]);    //RTC centre of tile has x on first index
            const pos_z = Buffer.from(pos_buffer,'hex').readFloatLE(i+4)-(diff[2]);  //RTC centre of tile has z on third index (z is up, unlike Gltf)
            const pos_y = Buffer.from(pos_buffer,'hex').readFloatLE(i+8)-(diff[1]);  //RTC centre of tile has y on Second index and its sign is negative.

            new_buffer_pos_sec.writeFloatLE(pos_x,byteOffset+0);
            new_buffer_pos_sec.writeFloatLE(pos_z,byteOffset+4);
            new_buffer_pos_sec.writeFloatLE(pos_y,byteOffset+8);
            byteOffset = byteOffset+12
        } 
    return new_buffer_pos_sec; 
}

function change_bufferView(BufferView, bin_pri_bufView,PricomponentType, bin_sec_bufView, SeccomponentType){
   // console.log(SeccomponentType, typeof SeccomponentType);
    pri_bufferViewList = readBuffer.readBuffer(bin_pri_bufView,PricomponentType);
    sec_bufferViewList = readBuffer.readBuffer(bin_sec_bufView,SeccomponentType);
    
    const LastElementofPrimaryBuffer = pri_bufferViewList[pri_bufferViewList.length-1];
    
    //console.log(LastElementofPrimaryBuffer);
    var updatedPositionList = [];
    if(BufferView == 3){
        sec_bufferViewList.forEach(SecPositions => {
            updatedPositionList.push(SecPositions+LastElementofPrimaryBuffer)
        });
    }
    
    if(BufferView == 4){
        sec_bufferViewList.forEach(SecPositions => {
            updatedPositionList.push(SecPositions+LastElementofPrimaryBuffer+1)
        });
    }
   // console.log(updatedPositionList)

    /**
     * Now if the last element of Secondary Buffer is more than 255, 
     * Then Buffer cannot be stored in 8bit or 1 Byte Binary.
     * If so, a new Buffer Unsigned Short i.e. 2Byte Binary has to be stored.
     */

    if(updatedPositionList[updatedPositionList.length-1] <= 255){
        /**
         * 5121 is Unsigned Byte of 1 Byte each.
         */
        const new_buf_sec = new Buffer.alloc(bin_sec_bufView.length);
        var offset = 0;
        for(let i=0;i<updatedPositionList.length;i++){
            new_buf_sec.writeUInt8(updatedPositionList[i],offset);
            offset += 1;
        }
        return new_buf_sec;  
    }
    
    if(updatedPositionList[updatedPositionList.length-1] > 255){
        /**
         * 5123 is Unsigned Short , Stores every value in 2 Bytes.
         */
        const new_buf_sec = new Buffer.alloc(bin_sec_bufView.length*2);
        
        var offset = 0;
        for(let i=0;i<updatedPositionList.length;i++){
            new_buf_sec.writeUInt16LE(updatedPositionList[i],offset);
            offset +=2;
        }
        
        return new_buf_sec;
    }
}

function updated_min_max(pos_buffer , normal_buf){
    pos_x_list = [];
    pos_z_list = [];
    pos_y_list = [];
    norm_x_list = [];
    norm_z_list = [];
    norm_y_list = [];
    for(let i = 0; i< pos_buffer.length; i = i+12) // XYZ three points takes 12 Bytes.
    {
        const pos_x = Buffer.from(pos_buffer,'hex').readFloatLE(i);   
        const pos_z = Buffer.from(pos_buffer,'hex').readFloatLE(i+4); 
        const pos_y = Buffer.from(pos_buffer,'hex').readFloatLE(i+8);
        pos_x_list.push(pos_x);
        pos_z_list.push(pos_z);
        pos_y_list.push(pos_y);
    }
    for(let i = 0; i< normal_buf.length; i = i+12) // XYZ three points takes 12 Bytes.
    {
        const norm_x = Buffer.from(normal_buf,'hex').readFloatLE(i);   
        const norm_z = Buffer.from(normal_buf,'hex').readFloatLE(i+4); 
        const norm_y = Buffer.from(normal_buf,'hex').readFloatLE(i+8);
        norm_x_list.push(norm_x);
        norm_z_list.push(norm_z);
        norm_y_list.push(norm_y);
    }
    const min_pos = [Math.min(...pos_x_list),Math.min(...pos_z_list),Math.min(...pos_y_list)]; // ... is a method in ES2015 to accomplish call min-max function on array. 
    const max_pos = [Math.max(...pos_x_list),Math.max(...pos_z_list),Math.max(...pos_y_list)];

    const min_norm = [Math.min(...norm_x_list),Math.min(...norm_z_list),Math.min(...norm_y_list)];
    const max_norm = [Math.max(...norm_x_list),Math.max(...norm_z_list),Math.max(...norm_y_list)];
    return [min_pos,max_pos,min_norm,max_norm];
}

function update_glb_json(pri_json,sec_glb_json,updated_min_max){
    var GLB_JSON = pri_json;
    for(let i = 0;i<GLB_JSON["accessors"].length;i++){
            GLB_JSON["accessors"][i]["count"] = pri_json["accessors"][i]["count"]+sec_glb_json["accessors"][i]["count"]
        }
    GLB_JSON["accessors"][0]["min"] = updated_min_max[0]
    GLB_JSON["accessors"][0]["max"] = updated_min_max[1]
    GLB_JSON["accessors"][1]["min"] = updated_min_max[2]
    GLB_JSON["accessors"][1]["max"] = updated_min_max[3]

    GLB_JSON["accessors"][2]["max"][0] = pri_json["accessors"][2]["max"][0] +sec_glb_json["accessors"][2]["max"][0];
    GLB_JSON["accessors"][3]["max"][0] = pri_json["accessors"][3]["max"][0] +sec_glb_json["accessors"][3]["max"][0] +1 ; //1 is added to make total sum equal for number of objects as it begins with 0 in both files.
    const maxIndex = GLB_JSON["accessors"][2]["max"][0];
    const maxCount = GLB_JSON["accessors"][3]["max"][0];
   
    // if maxIndex is more than 255 , than it needs 2Bytes for each element. SO it changes ByteOffset 

    for(let i=0;i<2;i++){
        GLB_JSON["bufferViews"][i]["byteLength"] = pri_json["bufferViews"][i]["byteLength"] + sec_glb_json["bufferViews"][i]["byteLength"]
        GLB_JSON["bufferViews"][i]["byteOffset"] = pri_json["bufferViews"][i]["byteOffset"] + sec_glb_json["bufferViews"][i]["byteOffset"]
    }
    /**
     * Check MaxIndex for BufferView3
     * and
     * MaxCount for BufferView4
     */
    if(maxIndex<=255){
        GLB_JSON["bufferViews"][2]["byteLength"] = pri_json["bufferViews"][2]["byteLength"] + sec_glb_json["bufferViews"][2]["byteLength"]
        GLB_JSON["bufferViews"][2]["byteOffset"] = pri_json["bufferViews"][2]["byteOffset"] + sec_glb_json["bufferViews"][2]["byteOffset"]
        
    }
    if(maxIndex > 255){
        GLB_JSON["bufferViews"][2]["byteLength"] = pri_json["bufferViews"][2]["byteLength"] + 2* sec_glb_json["bufferViews"][2]["byteLength"]
        GLB_JSON["bufferViews"][2]["byteOffset"] = pri_json["bufferViews"][2]["byteOffset"] + sec_glb_json["bufferViews"][2]["byteOffset"]
    }
    if(maxCount<255){
        GLB_JSON["bufferViews"][3]["byteLength"] = pri_json["bufferViews"][3]["byteLength"] + sec_glb_json["bufferViews"][3]["byteLength"]
        GLB_JSON["bufferViews"][3]["byteOffset"] = pri_json["bufferViews"][3]["byteOffset"] + sec_glb_json["bufferViews"][3]["byteOffset"]
    }
    if(maxCount>255){
       
        GLB_JSON["bufferViews"][3]["byteLength"] = pri_json["bufferViews"][3]["byteLength"] + 2* sec_glb_json["bufferViews"][3]["byteLength"]
        GLB_JSON["bufferViews"][3]["byteOffset"] = GLB_JSON["bufferViews"][2]["byteLength"]+  GLB_JSON["bufferViews"][2]["byteOffset"] // Check GlTF for better Understanding.    
    }
    GLB_JSON["buffers"][0]["byteLength"] = GLB_JSON["bufferViews"][3]["byteOffset"] + GLB_JSON["bufferViews"][3]["byteLength"]
    
    return GLB_JSON;

}
/**
 * 
 * @param {*GLB Header of 20 Bytes from Primary file is sent to this function, function automatically extracts required information} glb_header_pri 
 * @param {*This is the new GLB JSON that is created after updation} updated_GLB_JSON 
 * @param {*New GLB Binary after updation} updated_buf 
 * @param {*Original 8 Bytes after GLB JSON.} glb_pri_header_after_json_8bytes 
 */
function create_new_GLB(glb_header_pri,updated_GLB_JSON,updated_buf,glb_pri_header_after_json_8bytes){
    const json_length = JSON.stringify(updated_GLB_JSON).length;
    
    const bin_buf_length = updated_buf.length;

    const new_glb_top_header_1 = Buffer.from(glb_header_pri.slice(0,4),"ascii");    // text "glTF"
    const new_glb_top_header_2 = Buffer.alloc(4); 
    new_glb_top_header_2.writeUInt32LE(2,0);                                        // 2 is written for GLTF version 2.0
    const new_glb_top_header_3 = Buffer.alloc(4);
    new_glb_top_header_3.writeUInt32LE((json_length+bin_buf_length+20+8),0);        //total byte length
    const new_glb_top_header_4 = Buffer.alloc(4);
    new_glb_top_header_4.writeUInt32LE(json_length,0);                              //json byte length
    const new_glb_top_header_5 = Buffer.from(glb_header_pri.slice(16,20),"ascii"); //  text "json".

    /**
     *  convert json to buffer hex.
     */
    const str_json = JSON.stringify(updated_GLB_JSON);
    var a = []
    for (let i=0;i<str_json.length;i++){
        const hex = str_json[i].charCodeAt().toString(16);
        a.push(Buffer.from(hex,"hex"));
    }
    const new_glb_json = Buffer.concat(a);

    // ** JSON to hex buffer done. ** //

    /**
     * Finally last 8 bytes before actual float LE binary starts.
     */
    const after_json_4bytes_1 = new Buffer.alloc(4);
    after_json_4bytes_1.writeUInt32LE(bin_buf_length,0)
    const after_json_4bytes_2 = Buffer.from(glb_pri_header_after_json_8bytes.slice(4,8),"ascii"); //text BIN

    const new_GLB = Buffer.concat([new_glb_top_header_1,new_glb_top_header_2,new_glb_top_header_3,new_glb_top_header_4,new_glb_top_header_5,new_glb_json,after_json_4bytes_1,after_json_4bytes_2,updated_buf]);

    //fsExtra.writeFileSync("./GML Update test/ADD_Results/check.glb", new_GLB)
    return new_GLB;
}