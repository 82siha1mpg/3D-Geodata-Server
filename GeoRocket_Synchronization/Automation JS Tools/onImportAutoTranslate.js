 const PythonShell  = require('python-shell').PythonShell; 

exports.onImportStartTranslation = function(tempGMLPath,destBase,layername,lod , FMEmodel){            
        let options = {
            mode: 'text',
            pythonPath: 'python',
            pythonOptions: ['-u'], // get print results in real-time
            args: [tempGMLPath, destBase ,layername , lod , FMEmodel]
        };
            
        PythonShell.run("./Automation JS Tools/onImportTranslation.py", options, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            console.log('results: %j', results);
        });

    return 'Done!'    
}


