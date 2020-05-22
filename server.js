const fs = require('fs');

let scope = null;

const loadDefns = () => {
    console.log("loaded definitions");
    try {
        scope = JSON.parse(fs.readFileSync("scope.json", "utf8"));
    } catch (err) {
        console.log("err: ", err);
    }
}

const saveDefns = () => {
    if (scope) {
        fs.writeFileSync("scope.json", JSON.stringify(scope));
    } else {
        console.log('tried to save an empty scope')
    }
}

const builtin = {
    ";": (stack, _) => {
        let defn = [];
        for (let elem = stack.pop(); elem !== "|"; elem = stack.pop()) {
            defn.unshift(elem);
        }
        let name = stack.pop();
        scope[name] = defn;
    },
    ":": (stack, _) => {
        stack.push("|");
    },
    "call": (stack, output) => {
        let ins = stack.pop();
        doIns(stack, ins, output);
    },
    "swap": (stack, _) => {
        let a = stack.pop();
        let b = stack.pop();
        stack.push(a);
        stack.push(b);
    },
    "dup": (stack, _) => {
        let a = stack.pop();
        stack.push(a);
        stack.push(a);
    },
    "del": (stack, _) => {
        stack.pop();
    },
    "echo": (stack, output) => {
        output.buf = output.buf + stack.pop() + "\n";
    }
}

const doIns = (stack, ins, output) => {
    let op = builtin[ins];
    if (op) {
        op(stack, output);
    } else {
        let fn = scope[ins];
        if (fn) {
            doSeq(stack, fn, output);
        } else {
            if (ins.charAt(0) === "'") {
                stack.push(ins.slice(1));
            } else {
                throw 'reference error'
            }
        }
    }
}

const doSeq = (stack, ins, output) => {
    for (let i = 0; i < ins.length; i++) {
        doIns(stack, ins[i], output);
    }
}

/* SERVER */

const WebSocketServer = require('websocket').server;
const http = require('http');
 
let server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(25565, function() {
    console.log('server is listening on port 25565');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
wsServer.on('request', function(request) {
    let connection = request.accept('echo-protocol', request.origin);
    console.log('connection accepted.');

    connection.on('message', function(message) {
        let ins = message.utf8Data.split(" ");
        let output = {buf:""};
        let stack = [];

        loadDefns();

        if (message.type === 'utf8') {
            console.log('received:' + message.utf8Data);
            try {
                doSeq(stack, ins, output);
                console.log('evaluated:', stack, '\noutput:', output);
            } catch (err) {
                output.buf = JSON.stringify(err);
            }
            connection.sendUTF(output.buf);
        }

        saveDefns();
    });
    connection.on('close', function(reasonCode, description) {
        console.log('peer ' + connection.remoteAddress + ' disconnected');
    });
});