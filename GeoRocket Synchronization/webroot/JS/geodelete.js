function geo_delete(){
    document.getElementById("page-content").innerHTML = 
    '   <h2>DELETE</h2>\
        \Layer Name:<br> <input type="text" id="layername"> \
        <br> GML ID:<br>\
       <input type="text" id="gml_id"> \
        <br> LOD:<br>\
       <input type="text" id="lod"> \
        <br><br>\
        <button onclick="deleteFile()">Delete</button> \
        \
    ';
}

function deleteFile(){
    const layername = document.getElementById('layername').value;
    const gml_id  = document.getElementById('gml_id').value;
    const lod  = document.getElementById('lod').value;
    
    //connection string.
    const gerocket_host = "http://localhost:63020";
    const path = "/store/"+layername;
    const searchString = "?search="+gml_id
    const url = gerocket_host + path + searchString

    var xhr = new XMLHttpRequest();
    /**
     * xhr.path will add an object to XMLHttpRequest method's event.
     * This object can be accessed after the import is successful.
     * 
     */
      xhr.layername = layername;
      xhr.gml_id = gml_id;
      xhr.lod = lod ;
      xhr.open("DELETE", url , true);
      xhr.send();
      xhr.onreadystatechange = function(){
        if(this.readyState ==4 && this.status == 204){
            document.getElementById("page-content").innerHTML = "<h2>Operation successful!, Matching chunks are deleted.</h2>";
            startDeletion(this.layername,this.gml_id,this.lod)
        }  
        if(this.readyState ==4 && this.status == 400){
            document.getElementById("page-content").innerHTML = "<h2>The provided information was invalid</h2>";
        }  
        if(this.readyState ==4 && this.status == 500){
            document.getElementById("page-content").innerHTML = "<h2>An unexpected error occurred on the server side</h2>";
            }
        if(this.readyState ==4 && this.status == 0){
            document.getElementById("page-content").innerHTML = "<h2>Server is not Responding, Please check the connection and try again.</h2>";
            }
        }
}

function startDeletion(layername,gml_id,lod){
    var xhr = new XMLHttpRequest();
    const url = "/startDeletion?layername="+layername+"&gmlID="+gml_id+"&lod="+lod;
    xhr.open("GET",url,true);
    document.getElementById("page-content").innerHTML = "<h2>3D Models are now being setup for you!</h2>\
                                                         <img src = './w3images/models_processing.gif' width= '2%' height = '2%' >";
    xhr.send();
    xhr.onreadystatechange = function(){
        if(this.status == 200){
            document.getElementById("page-content").innerHTML = "<h2>Models are Updated successfully and are now, Ready to be Visualized!</h2>";
        }
    }
}