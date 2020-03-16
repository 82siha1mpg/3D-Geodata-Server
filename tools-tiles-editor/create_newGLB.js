const fs = require("fs")
/**
 * 
 * @param {*GLB Header of 20 Bytes from Primary file is sent to this function, function automatically extracts required information} glb_header_pri 
 * @param {*This is the new GLB JSON that is created after updation} updated_GLB_JSON 
 * @param {*New GLB Binary after updation} updated_buf 
 * @param {*Original 8 Bytes after GLB JSON.} glb_pri_header_after_json_8bytes 
 */
exports.create_newGLB = function(glb_header_pri,updated_GLB_JSON,updated_buf,glb_pri_header_after_json_8bytes){
    
    const str_json = JSON.stringify(updated_GLB_JSON);
    const json_length = str_json.length;
    
   // const padding = (str_json.length)%4;
    //const json_length = str_json.length + padding;
    //str_json.padEnd(json_length,' ');
    
    
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

    //console.log(json_length)
    //console.log("Total Byte Length",(json_length+bin_buf_length+20+8))
    //console.log(bin_buf_length)

    const after_json_4bytes_2 = Buffer.from(glb_pri_header_after_json_8bytes.slice(4,8),"ascii");

    const new_GLB = Buffer.concat([new_glb_top_header_1,new_glb_top_header_2,new_glb_top_header_3,new_glb_top_header_4,new_glb_top_header_5,new_glb_json,after_json_4bytes_1,after_json_4bytes_2,updated_buf]);
    
    return new_GLB;
}