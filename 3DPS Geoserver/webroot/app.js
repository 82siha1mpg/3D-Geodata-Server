
//CesiumIon Token Defined
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNWJhMTNjMS03NzU2LTRhNzctYmZmYy0yZDBiNjFkODE0MDAiLCJpZCI6OTEyMywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1MzUzMzk5OH0.H5d_3hj6nPPU6Vai6bMJmeDq5UsxVIcwrcEFlnzhxD8';

var viewer = new Cesium.Viewer('cesiumContainer');
//var oldstyling = null;
var dragging = undefined;
var drawing = false;
var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
var rectVisible = false;
var Pickers_3DTile_Activated = true;
var bboxactivated = false;
var terrain = new Cesium.CesiumTerrainProvider({
    url: 'http://localhost:8083/Assets/Terrain/Terrain_Bonn_Full_QuantizedMesh_29_10/'
});

viewer.terrainProvider = terrain;

function loadtiles(uri) {
    // first 2 lines to fetch url from the server.
    console.log(uri)
    var urinew = JSON.parse(uri);
    //var urinew = uri;
    var host = "http://localhost:8083/"
    //console.log("url called", urinew[0].url);
    var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: host+urinew[0].url ,
        //url: "http://localhost:8083/Assets2/3dtiles/BONN/data/data0.b3dm",
        debugShowBoundingVolume: false
    }));
   /*  viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(6.883695581679526,50.5539395904395, 0.0),
        billboard: {
            label:{text:'lc'},
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: false,
            disableDepthTestDistance: "999999"
        }
    });
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(7.354751184430684,50.72321143389869, 0.0),
        billboard: {
            label:{text:'UR'},
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: false,
            disableDepthTestDistance: "999999"
        }
    }); */
   


    tileset.readyPromise.then(function (tileset) {
        // Set the camera to view the newly added tileset
        //   viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
        viewer.zoomTo(tileset);
        //var center = Cesium.Cartesian3.fromDegrees(11.02854,50.98011);
        //viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 1000.0));

    });
}
// JavaScript source code
// draw box

function drawBounding() {
    rectVisible = true;
    drawing = false;
    Pickers_3DTile_Activated = false;
    toggleRectangleAndPins(true);
}
// part for drawing BB
var pinBuilder = new Cesium.PinBuilder();

var pin1 = viewer.entities.add({
    //position: Cesium.Cartesian3.fromDegrees(74.018997336757550443, 40.69846622682742776, 0.0),
    position: Cesium.Cartesian3.fromDegrees(9, 49, 0.0),
    billboard: {
        image: new Cesium.ConstantProperty(pinBuilder.fromText("UL", Cesium.Color.BLACK, 30)),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        show: false,
        disableDepthTestDistance: "999999"
    }
});

var pin2 = viewer.entities.add({
    //position: Cesium.Cartesian3.fromDegrees(73.969593360166612683, 40.758282705492597131, 0.0),
    position: Cesium.Cartesian3.fromDegrees(8.75, 49.25, 0.0),
    billboard: {
        image: new Cesium.ConstantProperty(pinBuilder.fromText("LR", Cesium.Color.BLACK, 30)),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        show: false,
        disableDepthTestDistance: "999999"
    }
});
var bbRectangle = viewer.entities.add({
    rectangle: {
        coordinates: new Cesium.CallbackProperty(getPinPositions, false),
        material: Cesium.Color.CYAN.withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        extrudedHeight: 1,
        show: false
    }
});

function toggleRectangleAndPins(show) {
    pin1.billboard.show = show;
    pin2.billboard.show = show;
    bbRectangle.rectangle.show = show;
}

handler.setInputAction(function (click) {
    if (rectVisible) {
        drawing = true;
        var position = getMousePosition(click.position);
        pin1.position._value = position;
        viewer.scene.screenSpaceCameraController.enableRotate = false;
    }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

handler.setInputAction(function () {
    if (rectVisible && drawing) {

        drawing = false;
        rectVisible = false;
        viewer.scene.screenSpaceCameraController.enableRotate = true;

    }

}, Cesium.ScreenSpaceEventType.LEFT_UP);

// drag PINs
handler.setInputAction(function (movement) {
    if (rectVisible) {
        var position = getMousePosition(movement.endPosition);
        if (position !== -1) {
            pin2.position._value = position;
            if (!drawing) {
                pin1.position._value = position;
            }
        }
    }
    //var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
    //var cartographic = Cesium.Cartographic.fromCartesian(cartesian);


    //longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
    //latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
    //entity_showLatLon.position = cartesian;
    //entity_showLatLon.label.text =
    //'Lat: ' + ('   ' + latitudeString) + '\u00B0' +
    //'\nLon: ' + ('   ' + longitudeString) + '\u00B0';

}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

function getMousePosition(mousePosition) {
    var ray = viewer.camera.getPickRay(mousePosition);
    var position = viewer.scene.globe.pick(ray, viewer.scene);
    if (!Cesium.defined(position) || !(dragging !== undefined || rectVisible === true)) {
        return -1;
    }
    return position;
}

function getPinPositionsAsDegreeArray() {
    var carto1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pin1.position.getValue(0));
    var carto2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pin2.position.getValue(0));
    var lon1 = Cesium.Math.toDegrees(carto1.longitude);
    var lat1 = Cesium.Math.toDegrees(carto1.latitude);

    var lon2 = Cesium.Math.toDegrees(carto2.longitude);
    var lat2 = Cesium.Math.toDegrees(carto2.latitude);

    var smallerLat = 0;
    var biggerLat = 0;
    if (lat1 < lat2) {
        smallerLat = lat1;
        biggerLat = lat2;
    } else {
        smallerLat = lat2;
        biggerLat = lat1;
    }
    var smallerLon = 0;
    var biggerLon = 0;
    if (lon1 < lon2) {
        smallerLon = lon1;
        biggerLon = lon2;
    } else {
        smallerLon = lon2;
        biggerLon = lon1;
    }
    return [smallerLon, smallerLat, biggerLon, biggerLat];
}

function getPinPositions() {
    var degreeArray = getPinPositionsAsDegreeArray();
    var rectangle = Cesium.Rectangle.fromDegrees(degreeArray[0], degreeArray[1], degreeArray[2], degreeArray[3]);
    return rectangle;
}
// Function to show the location on the mouse
var showpo = false;

var openShowLo = function () {
    if (!showpo) {
        showpo = true;
        entity_showLatLon.label.show = true;
    } else if (showpo) {
        showpo = false;
        entity_showLatLon.label.show = false;

    }
}

var entity_showLatLon = viewer.entities.add({
    label: {
        show: false,
        showBackground: true,
        font: '14px monospace',
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(15, 0),
        disableDepthTestDistance: "999999"
    }
});


function call_3DPS(){
    
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
	if(this.readyState ==4 && this.status == 200){
        //console.log(this.responseText);
        loadtiles(this.responseText);
    }
    }
        var degreeArray = getPinPositionsAsDegreeArray();
        const lodlevel = document.getElementById("lodlevel").value;
        const layername = document.getElementById("textrequest").value;
        var requestURL;
        console.log(layername)
        if(layername != ""){
            requestURL ="/service/v1?service=3DPS&version=1.0&request=GetScene&mime=3dtile&lod="+lodlevel+"&layer="+layername;
        }
        else{
            requestURL ="/service/v1?service=3DPS&version=1.0&request=GetScene&mime=3dtile&lod="+lodlevel+"&boundingbox="+degreeArray[0]+","+degreeArray[1]+","+degreeArray[2]+","+degreeArray[3];
        }
        
        console.log(requestURL);
		xhttp.open("GET",requestURL,true);
		xhttp.send();
}