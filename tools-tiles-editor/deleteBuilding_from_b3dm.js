const fsExtra = require('fs');
var extractB3dm = require('./lib/extractB3dm');
const Buffer = require('buffer').Buffer;
const writeb3dm = require('./createB3dm');
const glb2JSON = require('./JsonFromGLB');
const createGLB = require('./create_newGLB');

/*  ____Update B3dm here____
1. extract binary to fetch data out of the binary b3dm.
2. Then either call Add or Remove buildings using read binary buffer.
*/



function extract_binary(dir_path_b3dm){
    const b3dm_data = fsExtra.readFileSync(dir_path_b3dm);
    const b3dm = extractB3dm(b3dm_data);
    return b3dm;
}
 exports.delete_buildings = function(dir_path_b3dm,gml_id,outputFilePath){
    const b3dm = extract_binary(dir_path_b3dm);
   
    glb = b3dm.glb;
    geom_indexes = FindIndexOfGmlObject(b3dm,gml_id);
    const delete_geom_index = geom_indexes[0];
    
    /**
     * Check if building exist in this b3dm or not,
     * if yes, delete the building
     */
    if(delete_geom_index.length != 0){
        //console.log(b3dm.batchTable.binary.length)
        console.log("Updating", dir_path_b3dm)
        const deleteBooleanforAllObjects = geom_indexes[1];
        
        var glb_buffer = new Uint8Array(glb);
        gltfHeaderOffset = 0;
        gltfJsonLength = (Buffer.from(glb_buffer).slice(12,16)).readUInt32LE(0);
        gltfJsonOffset  = 20; //20 Bytes for GLB header.
        gltfBinaryOffset = 20+8+gltfJsonLength;
        
        gltfJSON = JSON.parse(glb2JSON.JsonFromGLB(glb));
        gltfHeader = glb_buffer.slice(gltfHeaderOffset,gltfJsonOffset);
        gltfBinary = glb_buffer.slice(gltfBinaryOffset,glb_buffer.length);
        
        fsExtra.writeFileSync("./GML Update test/delete/large.glb",glb)
        const glbHeader_afterJSON_8bytes = glb_buffer.slice((gltfJsonLength+20),(gltfJsonLength+20+8));

        /**
         * From GltfJSON read Position Array and then find index of Objects
         */
        
    

        /**
         * Update GLTF Binary
         */
        const BV3_ComponentType = gltfJSON["accessors"]["2"]["componentType"]
        const ObjectCount = gltfJSON["accessors"]["0"]["count"]; // number of vertices in the GLB Binary.
        glb_obj_index = FindGlbObjectIndex(ObjectCount, BV3_ComponentType , gltfBinary ) //index offset of the objects that needs to be deleted.
        const NewArray = update_gltfBinary(ObjectCount,gltfJSON,gltfBinary,glb_obj_index,delete_geom_index);
        const MinMax_list = NewArray[1];

        const NewgltfBinary = NewArray[0];  //UPDATED BINARY.
        
       // fsExtra.writeFileSync("./GML Update test/delete/gltf.bin", NewgltfBinary)
        /**
         * Update GLTF Json
         */
        const NewGltfJSON = update_gltfJSON(gltfJSON,delete_geom_index,glb_obj_index,MinMax_list,NewgltfBinary.length)
        
        
        /**
         * Updated GLB.
         * Updated Batch Table.
         * Updated Feature Table.
        */
       
        const Updated_GLB = createGLB.create_newGLB(gltfHeader,NewGltfJSON,NewgltfBinary,glbHeader_afterJSON_8bytes)
       // console.log(Updated_GLB)
        //fsExtra.writeFileSync("./GML Update test/delete/large.glb",glb)
       // fsExtra.writeFileSync('./GML Update test/delete/deleted_Object_check.glb',Updated_GLB);
        
       

        const Updated_BatchJSON = update_batchTable(b3dm.batchTable,deleteBooleanforAllObjects);
        const Updated_featureJSON = update_featureTable(b3dm.featureTable,deleteBooleanforAllObjects);
        
        writeb3dm.createB3dm(b3dm.batchTable.binary, Updated_featureJSON,Updated_BatchJSON,Updated_GLB,outputFilePath);
    }
}
    
function FindIndexOfGmlObject(b3dm ,delete_gml_id){
   //var all_geom_index = [];
   var delete_geom_index = [];
   var deleteBooleanforAllObjects = [];
   var count = 1;
   const parentid = b3dm.batchTable.json.gml_parent_id;
   const gmlid = b3dm.batchTable.json.gml_id;
   const role = b3dm.batchTable.json.citygml_feature_role;

   for(let i = 0;i<(b3dm.batchTable.json.gml_parent_id).length;i++){
       if(role[i] != 'address'){ 
        if( parentid[i] == delete_gml_id || gmlid[i] == delete_gml_id ){
            delete_geom_index.push(count);
           }
           //all_geom_index.push(count);
          // all_geom_index.push(count);
        count++;
       }
   }
   for(let i = 0; i<(b3dm.batchTable.json.gml_parent_id).length;i++){

    if( parentid[i] == delete_gml_id || gmlid[i] == delete_gml_id ){
        deleteBooleanforAllObjects.push(1);
    }
    else{
        deleteBooleanforAllObjects.push(0);
    }
    
   }
   //console.log(delete_geom_index,deleteBooleanforAllObjects)
   return [delete_geom_index,deleteBooleanforAllObjects];
}

function FindGlbObjectIndex(ObjectCount , BV3_ComponentType,  gltfBinary ){
    const new_all_geom_index= [];
    const GlbObjectIndex = [];
    buffer3Offset = (ObjectCount*4*3)+(ObjectCount*4*3);
    //console.log(BV3_ComponentType)
    var BV3ByteSize ;
    var temp_index = [];
    var lastItem= -1;
    if(BV3_ComponentType == 5121){
        BV3ByteSize= 1;
        buffer3end = buffer3Offset+(ObjectCount * BV3ByteSize);
        buffer3= gltfBinary.slice(buffer3Offset,buffer3end);

        for(let i =0;i<buffer3.length;i=i+BV3ByteSize){
            const indexes = Buffer.from(buffer3,"hex").readUInt8(i);
            
            temp_index.push(indexes); 
            if(lastItem !=indexes) 
            {
                new_all_geom_index.push(indexes);
                lastItem=indexes
            }
        }    
    }

    if(BV3_ComponentType == 5123)
    {
        BV3ByteSize= 2;
        buffer3end = buffer3Offset+(ObjectCount * BV3ByteSize);
        buffer3= gltfBinary.slice(buffer3Offset,buffer3end);
        
        for(let i =0;i<buffer3.length;i=i+BV3ByteSize){
            const indexes = Buffer.from(buffer3,"hex").readUInt16LE(i);
            temp_index.push(indexes);
            if(lastItem !=indexes) 
            {
                new_all_geom_index.push(indexes);
                lastItem=indexes
            }
        }
    }
    new_all_geom_index.forEach(obj =>{
        GlbObjectIndex.push([obj,temp_index.indexOf(obj),temp_index.lastIndexOf(obj)+1]);
    });

   // console.log("GlbObjectIndex",GlbObjectIndex)
    return GlbObjectIndex;
}

function update_gltfBinary(ObjectCount,gltfJSON,gltfBinary,glb_obj_index , delete_index){
    var componentType= {
        '5121':1,
        '5123':2
    };
    //console.log("Original Length",gltfBinary.length);
    
    const BV3_Type = gltfJSON["accessors"]["2"]["componentType"];
    const BV4_Type = gltfJSON["accessors"]["3"]["componentType"];
    //console.log(BV3_Type, BV4_Type)
    //var BV3_ByteSize= componentType[BV3_Type];
    var BV4_ByteSize= componentType[BV4_Type];
    
    const buffer1Offset = gltfJSON["bufferViews"]["0"]["byteOffset"];
    const buffer2Offset = gltfJSON["bufferViews"]["1"]["byteOffset"];
    const buffer3Offset = gltfJSON["bufferViews"]["2"]["byteOffset"];
    const buffer4Offset = gltfJSON["bufferViews"]["3"]["byteOffset"];

    const buffer1 =  gltfBinary.slice(buffer1Offset,buffer2Offset);
    const buffer2 =  gltfBinary.slice(buffer2Offset,buffer3Offset);
    const buffer3 =  gltfBinary.slice(buffer3Offset,buffer4Offset);
    const buffer4 =  gltfBinary.slice(buffer4Offset,(buffer4Offset+(ObjectCount*BV4_ByteSize)));
    /**
     * Required Slice function is called 4 times with all 4 buffers.
     * Everytime required peices of binary are added to all_pieces.
     * 
     */
    //var all_pieces = [];
    
    const NewBV1 = required_slices(buffer1,1,glb_obj_index , delete_index ,  5126);
    const NewBV2 = required_slices(buffer2,2,glb_obj_index , delete_index ,  5126);
    const NewBV3 = required_slices(buffer3,3,glb_obj_index , delete_index ,  BV3_Type);
    const NewBV4 = required_slices(buffer4,4,glb_obj_index , delete_index ,  BV4_Type);
    //const NewBV4 = Buffer4Slice(buffer4, glb_obj_index , delete_index ,  BV4_Type, ObjectCount);
    //console.log("Length of New Buffer View 3 :", NewBV4.length)

    const new_gltfBinary = Buffer.concat([NewBV1,NewBV2,NewBV3,NewBV4]);
    const minmax_list =  updated_min_max(NewBV1,NewBV2);
    //console.log(Buffer.from(new_gltfBinary).toString('hex') )
    return [new_gltfBinary,minmax_list];
}

function required_slices(buffer,buffer_num,all_indexes , delete_index, componentType){
    const all_pieces = []; // empty container to collect parts of Buffers
    
    var ChechBuffer4Values = 0;
    for (let i=0;i<all_indexes.length;i++){
        geom_obj=all_indexes[i];
           
        if(delete_index.indexOf(i+1) == -1){ // if object geom index is not found in delete, it will be added to buffer
            
            if(buffer_num < 3){
                //console.log(geom_obj[0], geom_obj[1],geom_obj[2])
                all_pieces.push(buffer.slice(geom_obj[1]*12,geom_obj[2]*12));    
            }
          
           if(buffer_num == 3 && componentType ==5121){
                const buf = buffer.slice(geom_obj[1],geom_obj[2])
                
              /* var newBuf3 = Buffer.alloc(buf.length);
                for(let i =0;i<buf.length;i++){
                    var val = Buffer.from(buf,"hex").readUInt8(i);    
                    newBuf3.writeUInt8(val,i);   
                }*/
                
                //** Start **//
                //** this block is editing bufferView2 and storing it in 5123 type, which is wrong, but 
                //*  Strangely it has solved the problem. Use it until further clarification *//
                var newBuf3 = Buffer.alloc(buf.length*2);
                var offset = 0;
                for(let i =0;i<buf.length;i++){
                    var val = Buffer.from(buf,"hex").readUInt8(i);    
                    newBuf3.writeUInt16LE(val,offset);   
                    offset +=2
                } 
                //** End **//
                
                all_pieces.push(newBuf3);
            }
            if(buffer_num==3 && componentType==5123){
                const buf = buffer.slice(geom_obj[1]*2,geom_obj[2]*2)
                var newBuf3 = Buffer.alloc(buf.length);
                for(let i =0;i<buf.length;i=i+2){
                    var val = Buffer.from(buf,"hex").readUInt16LE(i);    
                    newBuf3.writeUInt16LE(val,i);   
                }
                all_pieces.push(newBuf3);
            }
            if(buffer_num==4 && componentType==5121){
                const buf = buffer.slice(geom_obj[1],geom_obj[2]);
                var newBuf4 = Buffer.alloc(buf.length);
                
                var newValue4 = 0;
                const firstVal = Buffer.from(buf,"hex").readUInt8(0);
                const difference = firstVal - ChechBuffer4Values;
                var subtract = 0;
                if(ChechBuffer4Values ==0 && difference !=0) {
                    subtract = firstVal;
                }
                if(difference !=0 && ChechBuffer4Values !=0 ){
                    subtract = difference-1;
                }
                for(let i =0;i<buf.length;i++){
                    const val = Buffer.from(buf,"hex").readUInt8(i);
                    newValue4 = val - subtract;
                    newBuf4.writeUInt8(newValue4,i);
                    ChechBuffer4Values = newValue4;
                }
                all_pieces.push(newBuf4);
            }
            if(buffer_num==4 && componentType==5123){
                const buf = buffer.slice(geom_obj[1]*2,geom_obj[2]*2);
                var newBuf4 = Buffer.alloc(buf.length);
                var newValue4 = 0;
                const firstVal = Buffer.from(buf,"hex").readUInt16LE(0);
                const difference = firstVal - ChechBuffer4Values;
                var subtract = 0;
                if(ChechBuffer4Values ==0 && difference !=0) {
                    subtract = firstVal;
                }
                if(difference !=0 && ChechBuffer4Values !=0 ){
                    subtract = difference-1;
                }
                for(let i =0;i<buf.length;i=i+2){
                    const val = Buffer.from(buf,"hex").readUInt16LE(i);
                    newValue4 = val - subtract;
                   
                    newBuf4.writeUInt16LE(newValue4,i);
                    ChechBuffer4Values = newValue4;
                }
                all_pieces.push(newBuf4);
            }
        }
    }
    return Buffer.concat(all_pieces);
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

function update_gltfJSON(gltfJSON,delete_geom_index,glb_obj_index,MinMax_list,byteLength){
    var newCount=0;
    
    //glb_obj_index.forEach(geom_obj =>{
    for(let i=0;i<glb_obj_index.length;i++){
        geom_obj=glb_obj_index[i]
        if(delete_geom_index.indexOf(i+1) == -1){
            newCount=newCount+(geom_obj[2]-geom_obj[1]);
        }
    }
    for(let i =0; i<4;i++){
        if(i==0){
            gltfJSON.accessors[i]["count"]=newCount;
            gltfJSON.accessors[i]["min"] = MinMax_list[0];
            gltfJSON.accessors[i]["max"] = MinMax_list[1];

            gltfJSON.bufferViews[i]["byteLength"] = newCount*12;
        }
        if(i==1){
            gltfJSON.accessors[i]["count"]=newCount;
            gltfJSON.accessors[i]["min"] = MinMax_list[2];
            gltfJSON.accessors[i]["max"] = MinMax_list[3];

            gltfJSON.bufferViews[i]["byteOffset"] = newCount*12;
            gltfJSON.bufferViews[i]["byteLength"] = newCount*12;
        }
        if(i==2){
            gltfJSON.accessors[i]["count"]=newCount;
            //gltfJSON.accessors[i]["max"] = gltfJSON.accessors[i]["max"]; // Total 3 , delete 2. new max is 1.

            gltfJSON.bufferViews[i]["byteOffset"] = newCount*12*2;
           
            if(gltfJSON.accessors[i]["componentType"]==5121){
                gltfJSON.bufferViews[i]["byteLength"] = newCount;
            }

            if(gltfJSON.accessors[i]["componentType"]==5123){
                gltfJSON.bufferViews[i]["byteLength"] = newCount*2;
            }
        }
        if(i==3){
            gltfJSON.accessors[i]["count"]=newCount;
            gltfJSON.accessors[i]["max"] = [newCount-1];

            if(gltfJSON.accessors[i]["componentType"]==5121){
                gltfJSON.bufferViews[i]["byteOffset"] = (newCount*12*2) + newCount;
                gltfJSON.bufferViews[i]["byteLength"] = newCount;
            }
            if(gltfJSON.accessors[i]["componentType"]==5123){
                gltfJSON.bufferViews[i]["byteOffset"] = (newCount*12*2) + (newCount*2);
                gltfJSON.bufferViews[i]["byteLength"] = newCount*2;
            }
        }
}
gltfJSON.buffers[0].byteLength = byteLength;

return gltfJSON;
}

function update_batchTable(b3dm_batch, deleteBooleanforAllObjects){ 
    Object.keys(b3dm_batch.json).forEach((keys) => {
        n = b3dm_batch.json[keys].length;
        var lostObjects = 0;
        var index = 0;
        for (let i =0; i< n ; i++){
            if(deleteBooleanforAllObjects[i]==1){
                    index = i- lostObjects;
                    b3dm_batch.json[keys].splice(index, 1);
                    lostObjects++;
            }
        }   
    }) 
    return b3dm_batch.json
   }

function update_featureTable(b3dm_feature,deleteBooleanforAllObjects){
   const lostObjects = arr => arr.reduce((a,b) => a+b,0);
   b3dm_feature.json.BATCH_LENGTH = b3dm_feature.json.BATCH_LENGTH - lostObjects(deleteBooleanforAllObjects);
   return b3dm_feature.json;
}
