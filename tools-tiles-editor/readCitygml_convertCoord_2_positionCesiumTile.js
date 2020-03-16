var cesium = require('cesium');
const transformation = require('transform-coordinates');

/* function runthis_prog(){
    const fs  = require('fs');
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    const gml = fs.readFileSync('./GML Update test/two_objects.gml')
    var obj_gml;
    //var coords = [];
    parser.parseString(gml, function(error, result) {
                if(error === null) {
                    obj_gml = result; // parse gml and save in the global variable to be used later.              
                }
                else {
                    console.log(error);
                    }
                }); 
                var position_list = [];
                const centre = [4020781.142171801,495260.2798758373,4909919.777227561];
                traverse(obj_gml,position_list,centre); 
                console.log(position_list)          
} */
//runthis_prog()
// with export statement this module can be called from outside.            
exports.get_position = function(cityGML,emptyPOS,RTC_Center_tile){
    traverse(cityGML,emptyPOS,RTC_Center_tile);
}

function traverse(obj,position_list,centre){
    if( obj !== null && typeof obj == "object") {
        Object.entries(obj).forEach(([key, value]) => {
            if(key == "gml:posList"){
                const coords_list = value[0]["_"].split(" ");
                for(var i = 0;i<coords_list.length;i=i+3){
                    var cart_coord = convert2gltfposition(coords_list.slice(i,i+3).map(Number)); // .map(Number) converts the strings in list to numbers.
            
                    const x = cart_coord.x //parseFloat(Number(cart_coord.x).toFixed(9));
                    const y = cart_coord.y //parseFloat(Number(cart_coord.y).toFixed(9)) ;
                    const z = cart_coord.z //parseFloat(Number(cart_coord.z).toFixed(9));
                    const pos = [Number(x-centre[0]).toFixed(5),Number(z-centre[2]).toFixed(5),Number(centre[1]-y).toFixed(5)];
                    position_list.push(pos);
                }
            }
            traverse(value,position_list,centre)
        })
        }
    }

function convert2gltfposition(coords){
        const transform = transformation('EPSG:4326', '25832') // WGS 84 to Soldner Berlin
        const coords_deg = transform.inverse(coords);
        const coords_cart = cesium.Cartesian3.fromDegrees(coords_deg[0],coords_deg[1],coords_deg[2]);
        return coords_cart;
}
//console.log(position_list)