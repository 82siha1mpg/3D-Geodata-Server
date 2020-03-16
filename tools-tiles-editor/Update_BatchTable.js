exports.update_batchTable = function(pri_b3dm_batch,sec_b3dm_batch=undefined){
 Object.keys(pri_b3dm_batch.json).forEach((keys) => {
   pri_b3dm_batch.json[keys] = pri_b3dm_batch.json[keys].concat(sec_b3dm_batch.json[keys]) ; 
 })
 return pri_b3dm_batch.json;
}
