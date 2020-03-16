const fs = require('fs');
const zlib = require('zlib');

exports.UpdateFeatureJson = function(PrimarysceneBasePath, SecondarySceneBasePath){

    const GzipPriJSON = fs.readFileSync(PrimarysceneBasePath+"/features/0.json.gz");
    const PriJSON = JSON.parse(zlib.gunzipSync(GzipPriJSON));
    
    const GzipSecJSON  = fs.readFileSync(SecondarySceneBasePath+"/features/0.json.gz");
    const SecJSON = JSON.parse(zlib.gunzipSync(GzipSecJSON));

    var n = PriJSON.featureData.length-1 ;
    for(let i=0; i<SecJSON.featureData.length;i++){
        SecJSON.featureData[i].geometries[0].params.faceRange[0] += PriJSON.featureData[n].geometries[0].params.faceRange[1] + 1
        SecJSON.featureData[i].geometries[0].params.faceRange[1] += PriJSON.featureData[n].geometries[0].params.faceRange[1] + 1
        
        PriJSON.featureData.push(SecJSON.featureData[i]);
        n = n+1
    }
    //console.log(PriJSON.featureData[n].geometries[0].params.faceRange)

    const geomDataSecondary = SecJSON.geometryData[0].params;

    PriJSON.geometryData[0].params.vertexAttributes.position.count    += geomDataSecondary.vertexAttributes.position.count ;

    PriJSON.geometryData[0].params.vertexAttributes.normal.byteOffset += geomDataSecondary.vertexAttributes.normal.byteOffset -8 ;
    PriJSON.geometryData[0].params.vertexAttributes.normal.count += geomDataSecondary.vertexAttributes.normal.count;

    PriJSON.geometryData[0].params.vertexAttributes.uv0.byteOffset += geomDataSecondary.vertexAttributes.uv0.byteOffset -8 ;
    PriJSON.geometryData[0].params.vertexAttributes.uv0.count += geomDataSecondary.vertexAttributes.uv0.count;

    PriJSON.geometryData[0].params.vertexAttributes.color.byteOffset += geomDataSecondary.vertexAttributes.color.byteOffset -8 ;
    PriJSON.geometryData[0].params.vertexAttributes.color.count += geomDataSecondary.vertexAttributes.color.count;

    PriJSON.geometryData[0].params.vertexAttributes.region.byteOffset += geomDataSecondary.vertexAttributes.region.byteOffset -8;
    PriJSON.geometryData[0].params.vertexAttributes.region.count += geomDataSecondary.vertexAttributes.region.count;

    PriJSON.geometryData[0].params.featureAttributes.id.byteOffset += geomDataSecondary.featureAttributes.id.byteOffset -8;
    PriJSON.geometryData[0].params.featureAttributes.id.count += geomDataSecondary.featureAttributes.id.count;
 
    PriJSON.geometryData[0].params.featureAttributes.faceRange.byteOffset += geomDataSecondary.featureAttributes.faceRange.byteOffset -8;
    PriJSON.geometryData[0].params.featureAttributes.faceRange.count += geomDataSecondary.featureAttributes.faceRange.count;


    const PriJsonBuffer = Buffer.from(JSON.stringify(PriJSON),'utf8')
    const NewGzipPriJSON = zlib.gzipSync(PriJsonBuffer);
    fs.writeFileSync(PrimarysceneBasePath+"/features/0.json.gz",NewGzipPriJSON);
}