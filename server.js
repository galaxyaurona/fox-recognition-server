const express = require('express');

var path = require('path');
var multer = require('multer')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
var sys = require('sys')
const morgan = require('morgan');
var exec = require('child_process').exec;
var fs = require('fs')
var util = require('util');
// 
var log_stdout = process.stdout;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'classifying_images/')
    },
    filename: function (req, file, cb) {
        tokenized_name = file.originalname.split(".")
        extension = tokenized_name[tokenized_name.length - 1];
        cb(null, Date.now() + "." + extension)
    }
})

var upload = multer(
    {
        storage: storage,
        preservePath: true
    }
)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
app.use(morgan('combined',{stream: accessLogStream}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/upload', upload.single('image'), function (req, res) {
    if (!req.file)
        return res.status(400).send('No files were uploaded.');

    var image = req.file;

    var full_path = path.join(__dirname, image.path);
    var docker_command = "docker exec fox-recognition python label_image.py /classifying_images/" + image.filename;
    exec(docker_command, function (error, stdout, stderr) {
     
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        docker_response = JSON.parse(stdout)
        json_response = {};
        Object.keys(docker_response).forEach(function(key,index,array){
            docker_response[key] = parseFloat(docker_response[key])
            json_response[key] = Math.round(parseFloat(docker_response[key]) *100)+ " %"
        })
        json_response["prediction"] = docker_response["not fox"] > docker_response["fox"] ? "Image does not containt a fox" : "Image contains a fox" 
        res.json(json_response);
    });
    // Use the mv() method to place the file somewhere on your server 



});
console.log = function(d) { //
  accessLogStream.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
// static route for sending data
app.post('/measurement/measurements', function(req, res) {
     console.log("Body of request: "+JSON.stringify(req.body))
    res.json({"success":"true"});
});
app.get('/log', function(req, res) {
  
    res.sendFile(path.join(__dirname, 'access.log'));
});
// root index
app.use('/', express.static(path.join(__dirname, 'public')))
//
//let running_port = process.env.PORT | 3000;
var running_port = 80;
app.listen(running_port, function () {
    console.log('Example app listening on port ' + running_port)
})
