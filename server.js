
const express = require('express');
var http = require('http');
var https = require("https");

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
var log_stdout = process.stdout;


// MULTIER OPTION
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
// MULETER STORAGE OPTIONS
var upload = multer(
    {
        storage: storage,
        preservePath: true
    }
)
//SSL OPTION
var options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem")
};
// CREATE APP ROUTER

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
app.use(morgan('combined',{stream: accessLogStream}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './views')
app.set('view engine', 'pug')

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
        json_response["url"]= "/"+image.path;
        //console.log("json"+JSON.stringify(json_response))
        res.render("result",json_response);
    });
    // Use the mv() method to place the file somewhere on your server 



});


// overwite console log for logging purpose
console.log = function(d) { //
  accessLogStream.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// static route for sending data
app.post('/measurement/measurements', function(req, res) {
     console.log("Body of request: "+JSON.stringify(req.body))
    res.json({"success":"true"});
});
// ROUTE FOR LOGGING 
app.get('/log', function(req, res) {  
    res.sendFile(path.join(__dirname, 'access.log'));
});
app.use('/classifying_images', express.static(path.join(__dirname, 'classifying_images')))
// root index
app.use('/', express.static(path.join(__dirname, 'public')))
//
//let running_port = process.env.PORT | 3000;


// HTTPS SERVER
var server = http.createServer(app);
// SAFE GUARD FOR localhost
if (process.env.PORT != process.env.SSL_PORT)
    server = https.createServer(options, app);
server.listen(process.env.SSL_PORT || 443, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("address",server);
  console.log("Server listening at", addr.address + ":" + addr.port);
});
//

// redirect server
/*var redirectApp = express(),
  redirectServer = http.createServer(redirectApp);

redirectApp.use(function requireHTTPS(req, res, next) {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  })
*/
// PREVENT LOCAL HOST ISSUE
if (process.env.PORT != process.env.SSL_PORT)
  redirectServer.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0");

