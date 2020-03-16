const express = require("express");
//var request = require('request');

const app = express();
const path = require('path');
// const request = require("request");
//const requestajax = require("ajax-request");
const PORT = process.env.PORT || 8083;
const fs = require('fs');
const fsPromises = fs.promises;
//const boxIntersect = require('box-intersect');
//const cors = require('cors');
//var turf = require('turf');
const turf_contain = require("@turf/turf");
//const turf_bbox = require('@turf/bbox');
const turfProject = require("@turf/projection");
const zlib = require('zlib');
const traverse = require('./traverse_tile');


let config_json = fs.readFileSync('config.json');
let config = JSON.parse(config_json);    
let assetFolderName = config['asset_folder_name'];
var contents = fs.readFileSync(assetFolderName + "/boundingboxLookup.json");

//const intersects = require('rectangles-intersect');
//const spawn = require("child_process").spawn;
app.use(function (req, res, next) {
   // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   // res.header("Access-Control-Allow-Origin", '*');
          if (path.extname(req.url) === '.0') {
            res.header('Content-Type', 'application/octet-stream');
            res.header('Content-Encoding', 'gzip');
        }  
  next();
});
app.use(express.static(__dirname));
//app.use(cors()); //allow cross origin;

const server = require('http').createServer(app);
	server.listen(PORT, function () {
  console.log('The 3DPS Nodejs service running at localhost:%d/', server.address().port);
});



app.get("/service/v1", function (req, res) {
 //   if (typeof req.query.service == "string" && typeof req.query.request == "string" && typeof req.query.version == "string" && typeof req.query.request == "string" && typeof req.query.boundingbox == "string") {

  if (typeof req.query.service == "string" && typeof req.query.request == "string" && typeof req.query.version == "string" && typeof req.query.request == "string") {
    // Check Valid Service 
    if (req.query.service == "3DPS" || req.query.service == "3dps") {
      // Check Valid Version
      if (req.query.version == "1.0") {
        // Check Valid Request
          if (req.query.request == "GetScene") {
            if(req.query.mime=="3dtile"){
              /**
               * Bounding Box parameter is Optional.
               */
              var bbLookup = JSON.parse(contents)["3dtiles"];
              var resultArray = [];
            if(req.query.boundingbox != undefined){ 
                    var bbox_client = JSON.parse("[" + req.query.boundingbox + "]");
                    if (bbox_client.length >= 4) {
                      var count = 0;
                      // Looping Through all the boundingboxLookup.json
                      console.log('-------started checking the bbox request to the bblookup JSON-------');
                      for (let i = 0; i < bbLookup.length; i++) {
                        if(req.query.lod == bbLookup[i].lod){
                        var bbox_tile = JSON.parse("[" + bbLookup[i].boundingbox + "]");
                        //console.log(typeof(bbox_client));
                        //console.log(bbox_client);
                        
                        const box_client_turf = turf_contain.bboxPolygon(bbox_client);
                        const box_tile_turf = turf_contain.bboxPolygon(bbox_tile);

                        console.log(`iteration ${i+1}> Check the intersect of client bbox: [${bbox_client}] with tilebox [${bbox_tile}]`);
                        // Checking the bbox intersect with boxIntersect library
                        // more info: https://www.npmjs.com/package/@turf/turf

                        var overlap = turf_contain.intersect(box_client_turf, box_tile_turf);
                        var fully_contained = turf_contain.booleanContains(box_client_turf,box_tile_turf); // check if the box is completely within another
                        if (overlap == null && fully_contained == false) {
                          console.log(`iteration ${i+1}> no overlap`);
                        } 
                        else if(fully_contained == true) {
                          resultArray.push({"url":bbLookup[i].url,"mime": bbLookup[i].mime})
                        }
                        else if(overlap !=null && fully_contained == false){
                                //read the tile and create a new json which will be rendered by the client.
                                const findIndex = (bbLookup[i].url).indexOf(".json")
                                const temp_JSON_Path = (bbLookup[i].url).slice(0,findIndex)+"_temp.json";
                                console.log(temp_JSON_Path);
                                var tileset = fs.readFileSync(bbLookup[i].url);
                                tileset = JSON.parse(tileset);
                                traverse.newJSON(tileset,bbox_client,temp_JSON_Path);
                                //console.log(new_tile);
                                bbLookup[i].url = temp_JSON_Path;
                                resultArray.push({"url":bbLookup[i].url,"mime": "3dtile"})
                                
                        }
                      
                      }  
                        count++;
                        // Checking for the last iteration done, send the result back to the user
                        if (count == bbLookup.length){
                          console.log('processing done sending result to client');

                          if (resultArray.length > 0) {
                            console.log(`result Array : ${resultArray}`);
                            res.send(resultArray);
                          } else {
                            res.send("No Tileset in the specified Bounding Box");
                          }
                        }
                      // if ends
                      } // for ends
                    } else {
                      res.send({ "error": "Invalid Bounding Box" });
                    }
            }
            else{ //if bbox is not queried for then look for specific layer on the server.
               var lodcheck = 1;
                if(req.query.lod != undefined){
                  lodcheck = req.query.lod;
                }
              for(let i=0;i<bbLookup.length; i++){
               
                if(req.query.layer == bbLookup[i]["layer"] && lodcheck == bbLookup[i]["lod"])
                {
                  resultArray.push({"url":bbLookup[i].url,"mime": "3dtile"})
                }
              }
                  if (resultArray.length > 0) {
                    console.log(`result Array : ${resultArray}`);
                    res.send(resultArray);
                  } else {
                    res.send("No specified Layer found!");
                  }
            }
		} else if(req.query.mime=="i3s"){
            var bbLookup = JSON.parse(contents)["i3s"];
            var resultArray = [];

          if(req.query.boundingbox!= undefined){
            var count = 0;
            // Looping Through all I3S Layers of the boundingboxLookup.json
            console.log('-------started checking the bbox request to the bblookup JSON-------');
            
            /**
             * BBox from esri client may not be LR, and UR corner points.
             * So it has to be aligned into a bounding box.
             * Read the coordinates and make them in turf polygon format.
             * create a turf polygon from the points drawn by the user.
             * create a bounding box from that polygon.
             * then check intersection.
             */
            var bbox_client = JSON.parse("[" + req.query.boundingbox + "]");
            var poly = [];
            for(let i =0;i<bbox_client.length;i=i+2){
                poly.push([bbox_client[i],bbox_client[i+1]]);
            }
            poly = [poly];
            var req_box = turf_contain.polygon(poly); 
            req_box = turf_contain.bbox(req_box);
            client_poly = turf_contain.bboxPolygon(req_box);
            
            const bbox_client_turf =turfProject.toWgs84(client_poly);  //here is the box received from client 
            //console.log(bbox_client_turf);
            //console.log(req.query);
         //   console.log("wgs84",bbox_client_turf.geometry["coordinates"]);
            for (let i = 0; i < bbLookup.length; i++) {
              if(req.query.lod == bbLookup[i].lod){
                    const bbox_scene = JSON.parse("[" + bbLookup[i].boundingbox + "]");
                    const bbox_scene_turf = turf_contain.bboxPolygon(bbox_scene);
                   // console.log(bbox_scene_turf.geometry["coordinates"]);
                    
                    const check_intersect = turf_contain.intersect(bbox_scene_turf , bbox_client_turf);
                  //  console.log(check_intersect,i);
                    if(check_intersect !=undefined){
                        resultArray.push({"url":bbLookup[i].url,"mime": "i3s"});
                    }
            }
          }
           console.log("check done!",resultArray);
           // console.log(req.url);
            res.send(resultArray);
            res.end;
      }
      else{ //if bbox is not queried for then look for specific layer on the server.
        var lodcheck = 1;
                if(req.query.lod != undefined){
                  lodcheck = req.query.lod;
                }
        for(let i=0;i<bbLookup.length; i++){
          //console.log(bbLookup[i]["layer"])
          if(req.query.layer == bbLookup[i]["layer"] && lodcheck ==  bbLookup[i]["lod"] )
          {
            resultArray.push({"url":bbLookup[i].url,"mime": "i3s"})
          }
        }
            if (resultArray.length > 0) {
              console.log(`result Array : ${resultArray}`);
              res.send(resultArray);
            } else {
              res.send("No Layer with this name found!");
            }
        
      }
  }
		else{
			res.send("Requested MIME Type is not supported Choose either 3dtile / i3s");
		}
		} else if (req.query.request == "GetCapabilities") {
          res.send("... GetCapabilities Under-developing ...");
        } else {
          res.send({ "error": "Only GetScene, GetCapabilities request are available at the moment" });
        }
      } else {
        res.send({ "error": "Only acceptversions 1.0 is available at the moment" });
      }
    } else {
      res.send({ "error": "Service -" + req.query.service + "is not existed" });
    }
  }
 	else {
    res.send({
      "error": "missing parameters => please, check [service] or [request] or [boundingbox] parameters",
    });
  }
});
/**
 * Following code will get URL's and parse it.
 * every folder is checked for gz file and json response is given to the user.
 */
app.get("/rest/service*",function(req,res,next){
    var baseURL = req.url.split('/');    
    const n = baseURL.length;  
    var url = "";
    for(let i = 3 ;i<=n-2;i++){
      url = url + baseURL[i]+"/";  
    }
    if(baseURL[n-2] !='geometries'){ 
      url = url + baseURL[n-1].split("?")[0];
    }
    async function readdirAsync(path){
        try{
            return fsPromises.readdir(path);
        }
        catch(err){
            console.error("error",err); 
        }
    };
    fnames = readdirAsync(url);
    fnames.then(function(files){
        for(var i=0;i<files.length;i++){
            var bin_idx = files[i].indexOf('.bin.gz');
            if(path.extname(files[i]) === '.gz'&& bin_idx == -1){
            var contents = fs.readFileSync(path.join(url,"/",files[i]));
            res.setHeader('Content-Type','application/json;charset=utf-8');
            res.setHeader('Content-Encoding','gzip');
            res.send(contents); 
            } //end if loop for JSON files
            if(path.extname(files[i]) === '.gz'&& bin_idx != -1){
                var contents = fs.readFileSync(path.join(url,"/",files[i]));
                res.setHeader('Content-Encoding','gzip');
                res.send(contents); 
                } //end of loop for binary files.
        } 
    },function(error){
        console.log("error!",error);
    })
    //console.log(names);
    res.end;
    } //ending of app get call. 
);

app.get("/getLookupfile/",function(req,res){
  const file = fs.readFileSync("./Assets/boundingboxLookup.json")
  res.send(file);
  res.end;
})