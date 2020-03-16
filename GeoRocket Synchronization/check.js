console.time("created");
const LookUpjson = require('../GeoServer/Create_BBlookupV2')
LookUpjson.createLookup() //it will create or update lookup json in asset folder.
console.timeEnd("created");