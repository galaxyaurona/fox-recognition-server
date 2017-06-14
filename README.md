# fox-recognition-server
This repo is the web service to handle file upload and invoke the machine learning algorithm to detect whether an image contain a fox.
Need to set environment variable: `PORT, SSL_PORT, IP` to configurate port and IP to run
This repo assume some dockers image running on the same server, please check `start.sh`. 
This custom build docker images is the core of the fox detection service 

After running the docker images, run the server using
```
npm install
npm start
```

