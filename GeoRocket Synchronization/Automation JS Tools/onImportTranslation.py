import sys
import os
import ast

def conversion(src, dest_base, layername, lod, FMEmodel):
    if(lod==1):
        model_3dTiles = FMEmodel["_3dtile"]
        dest_3dtile = dest_base+"/LOD1/3DTiles/"+layername
        
        cmd = 'fme "'+ model_3dTiles +'" --SourceDataset_CITYGML "'+ src +'" --DestDataset_CESIUM3DTILES "'+ dest_3dtile +'"'
        print(cmd)
        os.system(cmd)

        model_i3s = FMEmodel["i3s"]
        dest_i3s = dest_base+"/LOD1/I3s/"+layername
#       
        cmd = 'fme "'+ model_i3s +'" --SourceDataset_CITYGML "'+ src +'" --DestDataset_I3S "' + dest_i3s + '"'
        print(cmd)
        os.system(cmd)
        scenePathtounpack = os.path.abspath(dest_i3s+"/layer.slpk")
        scenePathtounFolder = os.path.abspath(dest_i3s)
        unpackScenecommand = "7z x \""+ scenePathtounpack+"\" -o\""+scenePathtounFolder+"\""
        os.system(unpackScenecommand)

        print("Done!")
        sys.stdout.flush()

    if(lod==2):
        model_3dTiles = FMEmodel["_3dtile"]
        dest_3dtile = dest_base+"/LOD2/3DTiles/"+layername
        
        cmd = 'fme "'+ model_3dTiles +'" --SourceDataset_CITYGML "'+ src +'" --DestDataset_CESIUM3DTILES "'+ dest_3dtile +'"'
        print(cmd)
        os.system(cmd)

        model_i3s = FMEmodel["i3s"]
        dest_i3s = dest_base+"/LOD2/I3s/"+layername
     
        cmd = 'fme "'+ model_i3s +'" --SourceDataset_CITYGML "'+ src +'" --DestDataset_I3S "' + dest_i3s + '"'
        print(cmd)
        os.system(cmd)
        scenePathtounpack = os.path.abspath(dest_i3s+"/layer.slpk")
        scenePathtounFolder = os.path.abspath(dest_i3s)
        unpackScenecommand = "7z x \""+ scenePathtounpack+"\" -o\""+scenePathtounFolder+"\""
        print(unpackScenecommand)
        os.system(unpackScenecommand)

        print("Done!")
        sys.stdout.flush()

src = sys.argv[1]
dest_base = sys.argv[2]
layername = sys.argv[3]
lod = int(sys.argv[4])
FMEmodel = ast.literal_eval(sys.argv[5]) ##converts strings into dictionary.

conversion(src , dest_base, layername, lod, FMEmodel)


