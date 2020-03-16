const fs = require('fs');
const express = require("express");
var bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const prepareModels = require('./Automation JS Tools/onImportAutoTranslate');
const Addbuild2Models = require('./Automation JS Tools/onAddAutoTranslate3dtiles');
const _3dtilesDeleteBuildings = require('./Automation JS Tools/onDeleteAutoDelete3dtiles');
const addBuild = require('../tools-tiles-editor/addBuild_in_b3dm');
const i3sDeleteBuildings = require('./Automation JS Tools/onDeleteAutoDeleteI3S');
const addBuild2Scene = require('../tools-scene-editor/AddtoScene')
const LookUpjson = require('../GeoServer/Create_BBlookupV2')
const conf = JSON.parse(fs.readFileSync("./conf/conf.json"));
const georocket_host = conf.georocket_host;
const path_temp_folder = conf.temp_store_gml;
const destbasePath = conf.Assets;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", '*'); 
  next();
}); 

app.use(express.static(__dirname));
app.use(bodyParser.text({ type: 'text/html',limit: '100mb' })) // support text encoded bodies
app.use(bodyParser.urlencoded({limit: '100mb', extended: true})); // support encoded bodies

const server = require('http').createServer(app);
	server.listen(PORT, function () {
  console.log('Server running at localhost:%d/', server.address().port);
});

/**
 * The Following Parameters are required.
 * tempGMLPath :  Imported GML stored temporarily.
 * destBase : Destination path where all the models are stored.
 * layername: same name folder will be created in the destination assets
 * lod: level of details of models being generated.
 */
app.get("/startTranslation",function(req,res){
    const layer_path = georocket_host + req.query.store + req.query.layername
    const lod = req.query.lod;
    const xhr = new XMLHttpRequest();
    
    setTimeout(function(){                    //import of GML is still in process in the database.
      xhr.open("GET",layer_path,true);
      xhr.send(); 
    }, 10000 ) ;         //delaying 10000 milli seconds.                
    
    xhr.onreadystatechange = function(){
    //console.log(this.readyState,",",this.status);
      if(this.readyState == 4 && this.status == 200){
        const tempGMLPath = path_temp_folder+"temp.gml";
        fs.writeFileSync(tempGMLPath,this.responseText);
        if(lod == "1"){
          console.log("Started Converting the models");
          const FMEmodel = conf.FME_LOD1[0];
          
          processStatus = prepareModels.onImportStartTranslation(tempGMLPath,destbasePath, req.query.layername , lod , JSON.stringify(FMEmodel)); //once imported gml is put in temp folder. FME translation will begin.
          if(processStatus == "Done!"){
            console.log("Conversion Done.")
            //fs.unlinkSync(tempGMLPath)
            res.send("Done!")
          }
        }
        if(lod == "2"){
          console.log("Started Converting the models");
          const FMEmodel = conf.FME_LOD2[0];
          
          processStatus = prepareModels.onImportStartTranslation(tempGMLPath,destbasePath, req.query.layername , lod , JSON.stringify(FMEmodel)); //once imported gml is put in temp folder. FME translation will begin.
          if(processStatus == "Done!"){
            console.log("Conversion Done.")
            //fs.unlinkSync(tempGMLPath)
            res.send("Done!")
          }
        }
      } 
    } 
});
/**
 * Start Deletion Will simply read Layer name and GML ID.
 * It then triggers actions to delete particular GML from the Models.
 */

app.get("/startDeletion",function(req,res){
  const layername = req.query.layername;
  const lod = req.query.lod;
  const gmlID = req.query.gmlID;
  processStatus = _3dtilesDeleteBuildings.onDeleteStartUpdate3dtiles(layername, gmlID , lod)
  i3sDeleteBuildings.onDeleteStartUpdatei3s(layername, gmlID , lod)
  res.send("Done")
});

app.post("/startAddition",function(req,res){
  const lod = req.query.lod;
  const layername = req.query.layername;
  const forceAdd = req.query.forceadd;
  const newgml = req.body;

  //Write Temporary GML to translate it.
  const tempGMLPath = path_temp_folder+"temp.gml";
  fs.writeFileSync(tempGMLPath,newgml);
  
  if(lod == "1"){
    console.log("Started Updating the models");
    const FMEmodel = conf.FME_LOD1[0];
    const PrimaryDataPath = destbasePath+"/LOD1/3dtiles/"+layername+"/tileset/data/";
    const PrimaryScenePath = destbasePath+"/LOD1/I3S/"+layername+"/";

    //once imported gml is put in temp folder. FME translation will begin.
    
      const pythonTranslation = Addbuild2Models.onAddStartTranslation(tempGMLPath,path_temp_folder, layername , lod ,JSON.stringify(FMEmodel))
      pythonTranslation
      .then((result) =>{
          if(result == "Success!")
          {
            // *** From Here Code is written to Add buildings to the tiles. *** //
            const SecondaryB3dmtoAdd = path_temp_folder + "LOD1/3DTiles/" +layername + "/tileset/data/data0.b3dm"
            const PrimaryB3dm_S = fs.readdirSync(PrimaryDataPath);
            var add = "pending"
            for(let i=0;i<PrimaryB3dm_S.length;i++){
                const PrimaryB3dmName = PrimaryB3dm_S[i];
                PrimaryB3dm = PrimaryDataPath + PrimaryB3dmName;
                if(add=="pending"){
                  add = addbuild.update_add(PrimaryB3dm,SecondaryB3dmtoAdd,PrimaryB3dm,forceAdd); 
                  }
                  if(add == "added"){
                      console.log("Added Successfully!");
                      break;
                  }   
              }
            // *** End Tile Update ***//
            
            // ***From Here Code is written to Add Buildings to the Scene Layer. *** //
            const SecondaryScenetoAdd = path_temp_folder + "LOD1/I3s/" + layername + "/nodes/0/";
            addBuild2Scene.AddBuildingstoScene(PrimaryScenePath +"nodes/root/" , SecondaryScenetoAdd, forceAdd)
            // *** End Scene Update ***//
            res.sendStatus(200);
          } //End Succeeded Translation...
      }).catch((rejectMessgae)=>{
          console.log("Error: ", rejectMessgae);
          return "Failed"
    });
  }

  if(lod == "2"){
    console.log("Started Updating the models");
    const FMEmodel = conf.FME_LOD2[0];
    const PrimaryDataPath = destbasePath+"/LOD2/3dtiles/"+layername+"/tileset/data/";
    const PrimaryScenePath = destbasePath+"/LOD2/I3s/"+layername+"/";

    //once imported gml is put in temp folder. FME translation will begin.
    
      const pythonTranslation = Addbuild2Models.onAddStartTranslation(tempGMLPath,path_temp_folder, layername , lod ,JSON.stringify(FMEmodel))
      pythonTranslation
      .then((result) =>{
          if(result == "Success!")
          {
            // *** From Here Code is written to Add buildings to the tiles. *** //
            const SecondaryB3dmtoAdd = path_temp_folder + "LOD2/3DTiles/" +layername + "/tileset/data/data0.b3dm"
            const PrimaryB3dm_S = fs.readdirSync(PrimaryDataPath);
            PrimaryB3dm_S.forEach((PrimaryB3dmName)=>{
                PrimaryB3dm = PrimaryDataPath + PrimaryB3dmName;
                addBuild.update_add(PrimaryB3dm,SecondaryB3dmtoAdd,PrimaryB3dm,forceAdd); 
            });
            // *** End Tile Update ***//
            
            // ***From Here Code is written to Add Buildings to the Scene Layer. *** //
            const SecondaryScenetoAdd = path_temp_folder + "LOD2/I3s/" + layername + "/nodes/0/";
            addBuild2Scene.AddBuildingstoScene(PrimaryScenePath +"nodes/root/" , SecondaryScenetoAdd , forceAdd)
            // *** End Scene Update ***//
            res.sendStatus(200);
          } //End Succeeded Translation...
      }).catch((rejectMessgae)=>{
          console.log("Error: ", rejectMessgae);
          return "Failed"
    });
  }
});