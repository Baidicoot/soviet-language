# Soviet-Script

The main and default server for soviet-script is ws://aidan-network.duckdns.org:25565

## Useage
### Pushing Strings
To turn a word into a string literal, prepend a `'`. These nest.
### Defining Functions
Functions are the sole unit of computation in soviet-script. To define them, use the words `:` and `;`. For example:
```
'function-name : 'body-1 'body-2 ;
```
Note that all functions are mutable so you *should* make sure you aren't accedentally overwriting someone's function.
### Builtin Words
The builtin words other than `:` and `;` are:
- `swap` - swaps top two items on the stack
- `dup` - duplicates the top item on the stack
- `del` - deletes the top item on the stack
- `call` - calls the symbol on the top of the stack
- `echo` - echoes the symbol on the top of the stack
- `head` - takes the first character of the symbol on the top of the stack
- `empty` - an empty symbol
- `conc` - concats the top two symbols on the stack
- `if` - c a b if: if c, then call a, else call b
- `==` - checks for equality on the top two symbols on the stack
- `pair` - pairs the top two items on the stack
- `fst` - first item of the pair on the top of the stack
- `snd` - second item of the pair on the top of the stack