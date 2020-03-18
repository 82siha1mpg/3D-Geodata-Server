# 3D Portrayal Service Implementation 
This is an implementation of OGC based 3DPS Getscene Request service, which aims at implementing interoperability. This implementation also contains a pipeline that synchronizes two databases which reflects automatic updates in exsting 3D Models (3DTiles/Indexed 3D Scene Layer).

# What is 3DPS?
The 3D Portrayal Service Standard is a geospatial 3D content delivery implementation specification. It focuses on what is to be delivered in which manner to enable interoperable 3D portrayal. [Read more...](https://www.ogc.org/standards/3dp)

# Prerequisites
There are certain prerequirements that needs to be fulfilled. These are as follows: 
1. **GeoRocket:** This has been used as Primary database, which holds CityGML files. *Georocket Server* needs to be installed. *Server API* can be downloaded from [here](https://georocket.io/download/)!
2. **NodeJS:** It is also required to be installed on the machine, and can be obtained from [here](https://nodejs.org/en/)!

# Setup
To intialize, it is required to follow the following steps: 
1. Start GeoRocket Server from its installation directory. It will look like this:
![Image Georocket Server](https://github.com/82siha1mpg/3D-Geodata-Server/blob/master/Img/georocket.JPG)
2. Once Primary DB server starts, it is required to start Georocket Synchronization which aims at keeping primary and secondary database synced to each other.   

# Authors
* Harpreet Singh, harpreet19897079@gmail.com 
* Prof. Volker Coors, volker.coors@hft-stuttgart.de
* Mr. Stephan Bludovsky, Stephan.Bludovsky@lgl.bwl.de
Thanks :)
