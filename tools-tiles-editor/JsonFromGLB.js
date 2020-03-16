
exports.JsonFromGLB = function(glb){
    const json_len = Buffer.from(glb.slice(12,16),"hex").readUInt32LE(0)
    //const glb_header_pri = glb.slice(0,20);
    const glb_JSON = glb.slice(20,(json_len+20)); // 20 is added because in glb header, 0-20 bytes are showing the information of the content. So after reading the length of JSON, 20 is added more to extract actual Json.
    const glb_JSON_buffer = Buffer.from(glb_JSON,"hex");
    var json = ""
    for(let i = 0; i< glb_JSON_buffer.length; i++) 
        {
            const more_words = glb_JSON_buffer.slice(i,i+1).toString();
            json = json.concat(more_words)
        }
    return json;
}
