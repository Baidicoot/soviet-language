# Soviet-Script

The main and default server for soviet-script is ws://aidan-network.duckdns.org:25565

## Useage
### Running
To run, download and run `client.js` with `node client.js`

### Pushing Strings
To turn a word into a symbol, prepend a `'`. These nest. These are useful when you want delayed execution of words.

### Defining Functions
Functions are the sole unit of computation in soviet-script. To define them, use the words `:` and `;`. For example:
```
'function-name : 'body-1 'body-2 ;
```
Note that all functions are mutable so you *should* make sure you aren't accedentally overwriting someone's function.

### Inter-User communication
As all definitions are global, so processes can communicate by editing and reading the same definitions.

### Looping & Recursion
The simple function `'loop : 'loop ;` will loop through recursion. This will not suspend the other user's processes, because timesharing.

### Builtin Words
The builtin words other than `:` and `;` are:
- `swap` - swaps top two items on the stack
- `dup` - duplicates the top item on the stack
- `del` - deletes the top item on the stack
- `call` - calls the symbol on the top of the stack
- `echo` - echoes the symbol on the top of the stack
- `head` - takes the first character of the symbol on the top of the stack
- `empty` - an empty symbol
- `conc` - concats the list on the top of the stack
- `if` - c a b if: if c, then call a, else call b
- `==` - checks for equality on the top two symbols on the stack
- `cc` - current continuation
- `ld` - load continuation
- `get` - get property of object
- `set` - set property of object
- `scope` - current scope
- `cons` - x:xs
- `head` - first item in list
- `tail` - last items in list
- `parse` - parse json
- `stringify` - stringify object