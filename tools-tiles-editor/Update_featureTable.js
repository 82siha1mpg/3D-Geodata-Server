exports.update_featureTable = function(pri_b3dm_feature,sec_b3dm_feature=undefined){
    pri_b3dm_feature.json.BATCH_LENGTH = pri_b3dm_feature.json.BATCH_LENGTH + sec_b3dm_feature.json.BATCH_LENGTH
 return pri_b3dm_feature.json; 
}