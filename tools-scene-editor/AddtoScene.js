const fs = require('fs');
const zlib = require('zlib');
const extractCords = require('./readGeom');
const turf = require("@turf/turf");
//const kml = require("gtran-kml");
const addgeom = require('./lib/UpdateGeomAdd');
const changeFeatureJson = require('./lib/UpdateFeatureJsonAdd');
const MergeAttributes = require('./lib/UpdateAttribAdd');
/**
 * Take in Original Model and Models to 
 */

//const PrimarysceneBasePath = "./scenes/LGL/";
//const SecondarySceneBasePath = "./scenes/LGLNew/DEBW_0010004GHNn/nodes/0/"
//const PrimarysceneBasePath = "./scenes/LGLNew/1/";
//const SecondarySceneBasePath = "./scenes/LGLNew/DEBW_0010004GHQN/nodes/0/"


//TraverseSceneUpdate(PrimarysceneBasePath+"nodes/root/" ,SecondarySceneBasePath )
exports.AddBuildingstoScene = function(PrimarysceneBasePath, SecondarySceneBasePath, forceAdd){
    TraverseSceneUpdate(PrimarysceneBasePath, SecondarySceneBasePath, forceAdd)
}

function TraverseSceneUpdate(PrimarysceneBasePath, SecondarySceneBasePath, forceAdd){

    const rootNode = PrimarysceneBasePath
    const Gzip_3dIndexDoc = fs.readFileSync(rootNode+"3dNodeIndexDocument.json.gz")
    const root_3dIndexDoc = JSON.parse(zlib.gunzipSync(Gzip_3dIndexDoc));

    const children = root_3dIndexDoc.children
    const scenetree = []
    for(let i=0;i<children.length;i++){
        const child_href = children[i].href;
        const childNode = rootNode+child_href;
        const validchild = SceneAddUpdate(childNode, SecondarySceneBasePath);
        if(validchild == true || forceAdd == true){
            scenetree.push(child_href);   
        }   
    }
    if(scenetree.length !=0){
            /**
             * If after checking building falls inside the node
             * Building's geometry, feature json and attributes will be updated.
             */
            
            const PrimaryPath = rootNode + scenetree[0] +"/";
            console.log("Updating ", PrimaryPath);

            addgeom.addbuildInScene(PrimaryPath, SecondarySceneBasePath);
            changeFeatureJson.UpdateFeatureJson(PrimaryPath, SecondarySceneBasePath)
            MergeAttributes.MergeAttribAdd(PrimaryPath, SecondarySceneBasePath)

        TraverseSceneUpdate( rootNode + scenetree[0] +"/", SecondarySceneBasePath, forceAdd)
    }
    else{
        console.log("Update Complete!");
    }
}



function SceneAddUpdate(PrimarysceneBasePath, SecondarySceneBasePath){
    const PriNodeIndexDocGZIP = fs.readFileSync(PrimarysceneBasePath+"/3dNodeIndexDocument.json.gz");
    const PriNodeIndexDocJSON = JSON.parse(zlib.gunzipSync(PriNodeIndexDocGZIP));
    
    const SecNodeIndexDocGZIP = fs.readFileSync(SecondarySceneBasePath + "/3dNodeIndexDocument.json.gz" );
    const SecNodeIndexDocJSON = JSON.parse(zlib.gunzipSync(SecNodeIndexDocGZIP));
    const SecGeomGZIP = fs.readFileSync(SecondarySceneBasePath + "/geometries/0.bin.gz" );
    const SecGeomBin = zlib.gunzipSync(SecGeomGZIP);

    const Build2Add_CordsList = extractCords.extractCordsfromNode(SecGeomBin , SecNodeIndexDocJSON.mbs);    
    Build2Add_CordsList.push(Build2Add_CordsList[0]);

   const validAdd = checkAddinNodeisValid(PriNodeIndexDocJSON.mbs,Build2Add_CordsList);
  
   
    return validAdd;
}

function checkAddinNodeisValid(PriMBS, SecLinarRing){
    /**
     * if a building falls inside the tile node, then it will be added to the model.
     */
    const PriBBOX = sphere2bbox(PriMBS);
    const SecBBOX = Poly2Box(SecLinarRing);


/*   
    //to check Bbox of tiles
     const geojsonPri = {
        'type': 'FeatureCollection',
        'features': [PriBBOX]
      };
    const geojsonSec = {
        'type': 'FeatureCollection',
        'features': [SecBBOX]
      };
    kml.fromGeoJson(geojsonPri, "./checkbboxes/"+readNode+".kml", {name:readNode});
    kml.fromGeoJson(geojsonSec, "./checkbboxes/SecBbox.kml"); 
*/
    return turf.booleanContains(PriBBOX,SecBBOX);
}

function sphere2bbox(mbs){
    var pt = turf.point([mbs[0], mbs[1]]);
    var distance = mbs[2];
    var options = {units: 'meters'};

    var bearing = 0;
    const Sphere2PolyCoords = [];
    for(let i=0;i<4;i++){
        const destination = turf.rhumbDestination(pt, distance, bearing, options);
        Sphere2PolyCoords.push(destination.geometry.coordinates);
        bearing +=90;
    }
    Sphere2PolyCoords.push(Sphere2PolyCoords[0]);  // enter first point again to make it a linear ring.
    
    return Poly2Box(Sphere2PolyCoords);
}

function Poly2Box(LinearRingCoordList){
   // console.log(LinearRingCoordList)
    const polygon =  turf.polygon([LinearRingCoordList]);
    const rect = turf.bbox(polygon);
    const BboxPolygon = turf.bboxPolygon(rect);

    return BboxPolygon;
}