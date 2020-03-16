const PythonShell  = require('python-shell').PythonShell;
//const addBuild = require('../../tools-tiles-editor/addBuild_in_b3dm');
const fs = require('fs');

exports.onAddStartTranslation = function(tempGMLPath,path_temp_folder, layername, lod , FMEmodel ){            
    return new Promise((resolve,reject)=>{
        var rejectMessgae;
        var resolveMessage;
        let options = {
            mode: 'text',
            pythonPath: 'python',
            pythonOptions: ['-u'], // get print results in real-time
            args: [tempGMLPath, path_temp_folder ,layername , lod , FMEmodel]
        };
        PythonShell.run("./Automation JS Tools/onImportTranslation.py", options, function (err, results) {
        if (err){
            rejectMessgae = err
            console.log(err)
            reject(rejectMessgae);
        }
         if(!err){
            console.log(results);
            resolveMessage = "Success!";
            resolve(resolveMessage)
        } 
    })
}) //end of promise
            
    /* pythonTranslation
        .then((result) =>{
            if(result == "Success!")
            {
                const SecondaryB3dmtoAdd = path_temp_folder + "LOD1/3DTiles/" +layername + "/tileset/data/data0.b3dm"
                const PrimaryB3dm_S = fs.readdirSync(PrimaryDataPath);
                PrimaryB3dm_S.forEach((PrimaryB3dmName)=>{
                    PrimaryB3dm = PrimaryDataPath + PrimaryB3dmName
                    addBuild.update_add(PrimaryB3dm,SecondaryB3dmtoAdd,PrimaryB3dm,forceAdd); 
                });
                resolveMessage =  'Done!';
            }
        } )
        .catch((rejectMessgae)=>{
            console.log("Error: ", rejectMessgae);
            return "Failed"
        }); */
//return "Done!";     
}