function geo_import(){
    document.getElementById("page-content").innerHTML = 
    '   <h2>IMPORT</h2>\
        \Layer Name:<br> <input type="text" id="layername"> <br><br>\
        Tags:<br> <input type="text" id="tags"> \
        <br><br>\
        Level of Details:<br> <input type="text" id="lod">\
        <br><br>\
        <input type="file" id="importFile" multiple  onchange="handleFiles(this.files)">\
        \
    ';
    const inputElement = document.getElementById("importFile");
    inputElement.addEventListener("change", handleFiles, true);
        function handleFiles() {
                const fileList = this.files; // now you can work with the file list 
                const file = fileList[0];
                
                var reader = new FileReader();
                reader.readAsText(file,"utf-8");
                //console.log(reader);
                reader.onload = startImport;
            }
}

function startImport(){
    const layername = document.getElementById('layername').value ; 
    const tags = document.getElementById('tags').value;
    const lod = document.getElementById('lod').value;

    document.getElementById("page-content").innerHTML = '<img src="./w3images/processing.gif" />';
    const store = "/store/";
    
    var url = 'http://localhost:63020'+store+layername;
    if(tags !=""){
        url = url+"?tags="+tags;
    }

    var result = event.target.result;
    var xhr = new XMLHttpRequest();
    /**
     * xhr.path will add an object to XMLHttpRequest method's event.
     * This object can be accessed after the import is successful.
     * 
     */
      xhr.store = store;
      xhr.layername = layername;
      xhr.lod = lod;
      xhr.open("POST", url , true);
      xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
      xhr.send(result);
      xhr.onreadystatechange = function(){
        if(this.readyState ==4 && this.status == 202){
            document.getElementById("page-content").innerHTML = "<h2>Operation successful!, File is being imported asynchronously.</h2>";        
            startTranslation(this.store,this.layername, this.lod);
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

function startTranslation(store,layername,lod){
    var xhr = new XMLHttpRequest();
    const url = "/startTranslation?store="+ store +"&layername=" + layername +"&lod="+lod;
    xhr.open("GET",url,true);
    document.getElementById("page-content").innerHTML = "<h2>3D Models are now being setup for you!</h2>\
                                                         <img src = './w3images/models_processing.gif' width= '2%' height = '2%' >";
    xhr.send();
    xhr.onreadystatechange = function(){
        if(this.readyState == 4 && this.responseText == "Done!" ){
            document.getElementById("page-content").innerHTML = "<h2>All Set! Ready for visualization.</h2>";
        }
    }    
}