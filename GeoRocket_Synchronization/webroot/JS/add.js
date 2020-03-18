function geo_add(){
    document.getElementById("page-content").innerHTML = 
    '  <h2>ADD</h2>\
        \Layer Name:<br> <input type="text" id="layername"> <br> Tags:<br>\
       <input type="text" id="tags"> <br> Level of Details:<br>\
       <input type="text" id="lod"> <br><br>\
        <input type="file" id="AddFile" accept = "*.gml">\
        <br><br>\
        <input type = "checkbox" id="forceAdd" value="true">Force Add\
        <br><br>\
        <button onclick="AddFile()">Add</button> \
        \
    ';
}

function AddFile(){
    const files = document.getElementById('AddFile').files[0];
    var reader = new FileReader();    
    reader.readAsText(files,"utf-8");
    reader.onload = startAdd;  
  }
function startAdd(){

    const AddedGml = event.target.result;
   // console.log(typeof AddedGml);
    const layername = document.getElementById('layername').value;
    const tags  = document.getElementById('tags').value;
    const lod  = document.getElementById('lod').value;
    var forceAdd;
    if(document.getElementById('forceAdd').checked == true){
        forceAdd = document.getElementById('forceAdd').value;
    }
    else{
        forceAdd = false;
    }
    

    document.getElementById("page-content").innerHTML = '<img src="./w3images/processing.gif" />';

    //connection string.
    const store = "/store/";

    var url = 'http://localhost:63020'+store+layername;
    if(tags !=""){
        url = url+"?tags="+tags;
    }

    var xhr = new XMLHttpRequest();
    /**
     * xhr.path will add an object to XMLHttpRequest method's event.
     * This object can be accessed after the import is successful.
     * 
     */
      xhr.store = store;
      xhr.layername = layername;
      xhr.lod = lod;
      xhr.forceAdd = forceAdd;

      xhr.open("POST", url , true);
      xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
      xhr.send(AddedGml);
      xhr.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 202){
            document.getElementById("page-content").innerHTML = "<h2>Operation successful!, File is being Added asynchronously.</h2>";        
            startAddition(this.layername, this.lod,this.forceAdd, AddedGml);
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

function startAddition(layername,lod,forceAdd, newGML){
    var xhr = new XMLHttpRequest();
    const url = "/startAddition?layername=" + layername +"&lod="+lod+"&forceadd="+forceAdd;
    xhr.open("POST",url,true);
    document.getElementById("page-content").innerHTML = "<h2>3D Models are now being updated for you!</h2>\
                                                         <img src = './w3images/models_processing.gif' width= '2%' height = '2%' >";
    
    xhr.setRequestHeader("Content-Type","text/html")
    xhr.send(newGML);
    xhr.onreadystatechange = function(){
        console.log(this.readyState, this.status)
        if(this.readyState == 4 && this.status == 200 ){
            document.getElementById("page-content").innerHTML = "<h2>All Set! Ready for visualization.</h2>";
        }
    }  
}