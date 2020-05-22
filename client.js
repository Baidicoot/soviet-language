const wsc = require('websocket').client;
const prompt = require('prompt-sync')();

let client = new wsc();

client.on('connectFailed', function(error) {
    console.log('connection failed: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('wsc connected');

    connection.on('error', function(error) {
        console.log("connection error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('no longer enjoying soviet languages');
    });
    connection.on('message', function(message) {
        if (message.type === "utf8") {
            console.log(message.utf8Data);
        }
    });

    const repl = () => {
        let msg = prompt("sov>");
        if (msg === ":q") {
            console.log("press ctrl+c to exit");
            connection.close();
            while (true) continue;
        }
        connection.send(msg);
        setImmediate(repl);
    }

    const ping = () => {
        if (connection.connected) {
            connection.ping("ping");
            setTimeout(ping, 1000);
        }
    }

    setImmediate(repl);
    setImmediate(ping);
});

client.connect("ws://aidan-network.duckdns.org:25565/", "echo-protocol");