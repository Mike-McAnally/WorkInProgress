// Setting up a basic express server
const express = require('express');
const path = require('path');
const app = express();

const fs = require('fs');
const schedule = require('node-schedule');
const PDF2Pic = require("pdf2pic");

app.use(express.json());

// Modify listening port value if needed
const PORT = 3025;
const HOST = '0.0.0.0';
// Configuring easyrtc server for NAF
const webServer = require('http').Server(app);
const socketServer = require('socket.io')(webServer);
const easyrtc = require('easyrtc');
const myIceServers = [
    { 'url': 'stun:stun.l.google.com:19302' },
    { 'url': 'stun:stun1.l.google.com:19302' },
    { 'url': 'stun:stun2.l.google.com:19302' },
    { 'url': 'stun:stun3.l.google.com:19302' },
];

easyrtc.setOption('appIceServers', myIceServers);
easyrtc.setOption('logLevel', 'debug');
easyrtc.setOption('demosEnable', false);

// easyrtc methods override; pre-made code from https://github.com/networked-aframe/networked-aframe/blob/master/server/easyrtc-server.js
easyrtc.events.on("easyrtcAuth", function (socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, { "isShared": false });

        console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
    console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

app.get(/(.*\.pdf)\/([0-9]+)$/i, async function (req, res) {
    const pdfPath = path.join(__dirname, `./public_html/assets/pdf/${req.params[0]}`);
    const pageNumber = req.params[1];

    const pdf2pic = new PDF2Pic({
        density: 100,
        savename: `${req.params[0]}-${pageNumber}`,
        savedir: "./public_html/assets/tmp", 
        format: "png",   
        size: "1190x1684"
    });
    
    pdf2pic.convert(pdfPath, pageNumber).then(file => {
        if (!file.name) {
            res.status(500).send('Could not convert file');
            return;
        }

        const response = {
            path: `/assets/tmp/${file.name}`
        }

        // deletes file created after 24 hours
        scheduleJob(86400000, deleteFileIfExists, path.join(__dirname, `./public_html/assets/tmp/${file.name}`));
        res.send(response);
    })
});

function scheduleJob(time, callback, args) {
    const startTime = new Date(Date.now() + time);
    schedule.scheduleJob(startTime, function() {
        callback(args);
    });
}

function deleteFileIfExists(path) {
    if(fs.existsSync(path)) {
        console.log('Deleting file in path:')
        console.log(path);
        fs.unlinkSync(path);
    }
}

function run() {
    // Return HTML pages in public directory when path matches
    app.use('/', express.static(path.join(__dirname, './public_html')));

    webServer.listen(PORT, HOST, () => {
        console.log(`app running on http://localhost:${PORT}`);
    });
}

module.exports = run;

if (require.main === module) {
    run();
}
