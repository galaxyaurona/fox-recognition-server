#!bin/bash
docker run -td --name fox-recognition -v $(pwd)/classifying_images/:/classifying_images galaxyaurona/fox-recognition:latest 
docker run -td --name goofy-recognition -v $(pwd)/classifying_images/:/classifying_images galaxyaurona/goofy-recognition:latest 
# OR
# docker start fox-recognition

#docker exec fox-recognition python label_image.py /classifying_images/classifying_image.jpg