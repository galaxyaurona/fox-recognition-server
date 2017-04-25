#!bin/bash
docker run -td --name fox-recognition -v /classifying_images/:/classifying_images galaxyaurona/fox-recognition:latest 
# OR
# docker start fox-recognition

docker exec fox-recognition python label_image.py /classifying_images/classifying_image.jpg