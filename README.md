# 3D Portrayal Service Implementation 
This is an implementation of OGC based 3DPS Getscene Request service, which aims at implementing interoperability. This implementation also contains a pipeline that synchronizes two databases which reflects automatic updates in exsting 3D Models (3DTiles/Indexed 3D Scene Layer).

# What is 3DPS?
The 3D Portrayal Service Standard is a geospatial 3D content delivery implementation specification. It focuses on what is to be delivered in which manner to enable interoperable 3D portrayal. [Read more...](https://www.ogc.org/standards/3dp)

# Prerequisites
There are certain prerequirements that needs to be fulfilled. These are as follows: 
1. **GeoRocket:** This has been used as Primary database, which holds CityGML files. *Georocket Server* needs to be installed. *Server API* can be downloaded from [here](https://georocket.io/download/)!
2. **NodeJS:** It is also required to be installed on the machine, and can be obtained from [here](https://nodejs.org/en/)!
3. **FME:** It is a product of Safe Software Inc, which is used to translate data formats. It is required to be installed on the system in order to make this repo work, as it is used for the translation of CityGML to 3D Tiles/Indexed 3D Scene layers.

# Setup
To intialize, it is required to follow the following steps: 
1. Start GeoRocket Server from its installation directory. It will look like this:
![Image Georocket Server](https://github.com/82siha1mpg/3D-Geodata-Server/blob/master/Img/georocket.JPG)
2. Once Primary DB server starts, it is required to start Georocket Synchronization which aims at keeping primary and secondary database synced to each other. Following commands shall be executed:
```
cd GeoRocket_Synchronization    
npm install                     // To install dependencies
node server.js                  // To initialize synchronization pipeline in listening mode.
```
3. After initializing Synchronization pipeline, 3D geodata server must be started. To run this server following commands needs to be executed in the windows commands prompt:
```
cd 3DPS Geoserver    
npm install                     // To install dependencies
node server.js                  // To initialize synchronization pipeline in listening mode.
```
Now, implementation is ready to be used :)
# Test Run
Once the system is up and ready to be used, user can start bringing in the data. As mentioned above, GeoRocket is used as Primary DB in this implementation, a http interface is used to manage it. It can execute three different commands: _*Import, Add, Delete*_.
* _Import_: Import new cityGml file using this button. It will first bring in the cityGml into the GeoRocket DB and after that it creates 3d models for this new data.
* _Add_: If there is a new building that needs to be added, can be imported using this option. This building will be imported into GeoRocket DB. After this, it will automatically add this new building into 3D Tiles and Indexed 3D Scene Layers.
* _Delete_: Using this option, any errorneous building can be deleted. It will first delete data from GeoRocket, and then it will delete building from existing 3D Tile and Indexed 3D Scene. 

# 3D Visualization
Once 3D models are created and published as assets, they are ready to be visualized. Two web applications are created using Cesium JS API and Esri JS API. These applications allow users to draw a bounding box on the virtual digital globes and send request to the Server. 3D Data can then be visualized on Cesium and Esri globes.   

# Authors
* Harpreet Singh, harpreet19897079@gmail.com 
* Prof. Volker Coors, volker.coors@hft-stuttgart.de
* Mr. Stephan Bludovsky, Stephan.Bludovsky@lgl.bwl.de
