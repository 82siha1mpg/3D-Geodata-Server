const fs = require('fs');
const zlib = require('zlib');

exports.MergeAttribAdd=function(PrimaryPath, SecondarySceneBasePath){

    const priAttribdir = fs.readdirSync(PrimaryPath+'/attributes')
    const SecAttribdir = fs.readdirSync(SecondarySceneBasePath+'/attributes')
    
    for(let i=0;i<priAttribdir.length;i++){
        if(priAttribdir[i]==SecAttribdir[i]){
            const gzPriBinAttrib = fs.readFileSync(PrimaryPath+'/attributes'+"/"+priAttribdir[i]+"/0.bin.gz");
            const PriBinAttrib = zlib.gunzipSync(gzPriBinAttrib);

            const gzSecBinAttrib = fs.readFileSync(SecondarySceneBasePath+'/attributes'+"/"+SecAttribdir[i]+"/0.bin.gz");
            const SecBinAtrrib = zlib.gunzipSync(gzSecBinAttrib);
            
            const featuresinPrimary = Buffer.from(PriBinAttrib).readUInt32LE(0);
            const featuresinSecondary = Buffer.from(SecBinAtrrib).readUInt32LE(0);

            const NewAttribcount = featuresinPrimary + featuresinSecondary;
            const NewAttribcountBuffer = Buffer.alloc(4);
            NewAttribcountBuffer.writeUInt32LE(NewAttribcount);

            const PriAttribheaderBuffer = PriBinAttrib.slice(4, (4+featuresinPrimary*4));
            const SecAttribheaderBuffer = SecBinAtrrib.slice(4, (4+featuresinSecondary*4)) 

            const PriAttribBodyBuffer = PriBinAttrib.slice((4+featuresinPrimary*4), PriBinAttrib.length);
            const SecAttribBodyBuffer = SecBinAtrrib.slice((4+featuresinSecondary*4), SecBinAtrrib.length)
            
            const newAtrribBuffer = Buffer.concat([NewAttribcountBuffer,PriAttribheaderBuffer,
                                                    SecAttribheaderBuffer,
                                                    PriAttribBodyBuffer,
                                                    SecAttribBodyBuffer
                                                ]);
            /**
             * Total Attributes
             * All ID's
             * Body that contains data.
             */
            const gznewAtrribBuffer = zlib.gzipSync(newAtrribBuffer);

            fs.writeFileSync(PrimaryPath+'/attributes'+"/"+priAttribdir[i]+"/0.bin.gz" ,gznewAtrribBuffer); 
        }
    }
}