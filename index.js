// Setting up a basic express server
const express = require('express');
const path = require('path');
const app = express();

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