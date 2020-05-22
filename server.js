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
    ";": (state, _) => {
        let defn = [];
        for (let elem = state.stack.pop(); elem !== "|"; elem = state.stack.pop()) {
            defn.unshift(elem);
        }
        let name = state.stack.pop();
        scope[name] = defn;
    },
    ":": (state, _) => {
        state.stack.push("|");
    },
    "call": (state, output) => {
        let sym = state.stack.pop();
        state.ins.list.unshift(sym);
    },
    "swap": (state, _) => {
        let a = state.stack.pop();
        let b = state.stack.pop();
        state.stack.push(a);
        state.stack.push(b);
    },
    "dup": (state, _) => {
        let a = state.stack.pop();
        state.stack.push(a);
        state.stack.push(a);
    },
    "del": (state, _) => {
        state.stack.pop();
    },
    "echo": (state, output) => {
        let s = state.stack.pop();
        if (typeof s === "string") {
            output.buf = output.buf + s;
        } else {
            output.buf = output.buf + JSON.stringify(s)
        }
    },
    "chars": (state, _) => {
        let a = state.stack.pop();
        let ls = [];
        for (let i = 0; i < a.length; i++) {
            ls.push(a.charAt(i));
        }
        state.stack.push(ls);
    },
    "conc": (state, _) => {
        let a = state.stack.pop();
        state.stack.push(a.join(""));
    },
    "if": (state, _) => {
        let a = state.stack.pop();
        let b = state.stack.pop();
        let c = state.stack.pop();
        if (c) {
            state.ins.list.unshift(a);
        } else {
            state.ins.list.unshift(b);
        }
    },
    "==": (state, _) => {
        let a = state.stack.pop();
        let b = state.stack.pop();
        if (a === b) {
            state.stack.push(true);
        } else {
            state.stack.push(false);
        }
    },
    "cc": (state, _) => {
        state.stack.push(cln(state.ins));
    },
    "ld": (state, _) => {
        let a = state.stack.pop();
        if (typeof a === "object") {
            state.ins = a;
        } else {
            throw 'typeerror'
        }
    },
    "scope": (state, _) => {
        state.stack.push(cln(scope));
    },
    "get": (state, _) => {
        let obj = state.stack.pop();
        let prop = stack.state.pop();
        if (typeof obj === "object") {
            state.stack.push(obj[prop]);
        } else {
            throw 'typeerror'
        }
    },
    "set": (state, _) => {
        let obj = cln(state.stack.pop());
        let prop = stack.state.pop();
        let val = stack.state.pop();
        if (typeof obj === "object") {
            obj[prop] = val;
            state.stack.push(obj);
        } else {
            throw 'typeerror'
        }
    },
    "cons": (state, _) => {
        let obj = cln(state.stack.pop());
        let v = stack.state.pop();
        if (obj.push) {
            obj.push(v);
            state.stack.push(obj);
        } else {
            throw 'typeerror'
        }
    },
    "head": (state, _) => {
        let obj = cln(state.stack.pop());
        if (obj.pop) {
            state.stack.push(obj.pop());
        } else {
            throw 'typeerror'
        }
    },
    "tail": (state, _) => {
        let obj = cln(state.stack.pop());
        if (obj.pop) {
            obj.pop();
            state.stack.push(obj);
        } else {
            throw 'typeerror'
        }
    },
    "parse": (state, _) => {
        let obj = state.stack.pop();
        if (typeof obj === "string") {
            state.stack.push(JSON.parse(obj));
        } else {
            throw 'typeerror'
        }
    },
    "stringify": (state, _) => {
        let obj = state.stack.pop();
        state.stack.push(JSON.stringify(obj));
    },
}

const cln = (obj) => JSON.parse(JSON.stringify(obj));

const step = (state, output) => {
    let currIns = state.ins.list.shift();
    if (currIns === undefined) {
        state.ins = state.ins.parent;
        return;
    }
    let op = builtin[currIns];
    if (op) {
        op(state, output);
        return;
    }
    let fn = scope[currIns];
    if (fn) {
        state.ins = {list:fn.slice(), parent:state.ins};
        return;
    }
    if (currIns.charAt(0) === "'") {
        state.stack.push(currIns.slice(1));
        return;
    }
    throw 'reference error'
}

let procs = [];
let conns = [];
let currUser = 0;

const rmProc = (id) => {
    procs.splice(id, 1);
    conns.splice(id, 1);
}

const addProc = (conn, proc) => {
    procs.push(proc);
    conns.push(conn);
}

const timeshare = () => {
    if (procs.length === 0) return;
    if (!conns[currUser].connected) {
        conns[currUser].close();
        rmProc(currUser);
        return;
    }
    if (!procs[currUser].ins) {
        conns[currUser].send("halt");
        rmProc(currUser);
        return;
    }
    let output = {buf:""};
    try {
        step(procs[currUser], output);
        if (output.buf !== "") {
            console.log("sent ", output.buf);
            conns[currUser].sendUTF(output.buf);
        }
    } catch (err) {
        console.log(err);
        conns[currUser].send(err);
        conns[currUser].close();
        rmProc(currUser);
    }
    currUser += 1;
    if (currUser >= procs.length) {
        currUser = 0;
    }
}

/* OLD, DEPRICATED EVAL

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

*/

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
    console.log('connection accepted');

    connection.on('message', function(message) {
        let ins = message.utf8Data.split(" ");
        let state = {stack:[], ins:{list:ins, parent:null}};

        saveDefns();
        addProc(connection, state);
    });

    connection.on('close', function(reasonCode, description) {
        console.log('peer ' + connection.remoteAddress + ' disconnected');
    });
});

loadDefns();

const main = () => {
    timeshare();
    setImmediate(main);
}

main();