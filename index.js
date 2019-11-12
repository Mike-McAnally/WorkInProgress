// Load required modules
const http = require("http");
const express = require("express");
const serveStatic = require('serve-static');
const socketIo = require("socket.io");
const easyrtc = require("easyrtc");
const path = require('path');
const PDF2Pic = require("pdf2pic");

// Set process name
process.title = "node-easyrtc";

// Get port or default to 3025
var port = process.env.PORT || 3025;

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(express.json());
app.use(serveStatic('public_html', {'index': ['Islands.html']}));

// Start Express http server
var webServer = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

var myIceServers = [
  {"url":"stun:stun.l.google.com:19302"},
  {"url":"stun:stun1.l.google.com:19302"},
  {"url":"stun:stun2.l.google.com:19302"},
  {"url":"stun:stun3.l.google.com:19302"}
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

/*
 *  PDF API
 */
app.get(/(.*\.pdf)\/([0-9]+)$/i, async function (req, res) {
    try {
        const pdfPath = path.join(__dirname, `./public_html/assets/pdf/${req.params[0]}`);
        const fileName = req.params[0].substring(1, req.params[0].length - 4)
    
        const pdf2pic = new PDF2Pic({
            density: 100,
            savename: fileName,
            savedir: `./public_html/assets/tmp/${fileName}`, 
            format: "png",   
            size: "1190x1684"
        });
        
        const files = await pdf2pic.convertBulk(pdfPath, -1)
        
        const response = {
            pages: files.length,
            files
        }
        res.send(response);
    } catch(e) {
        console.log(e);
        res.status(500).send('Could not convert file');
    }
});

//listen on port
webServer.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});
