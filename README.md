# finder

a simple go program to search for certain folderstructures

### INFO

not usable yet, but hopefully soon!!!

### Idea

First Idea for a structure

```json
// A default struct to find git Repositories
{
    "name": "*",
    // "files": ["*"],
    "folders": [{
        "name": ".git"
        // "files":
        // "folders":
    }]
}

// *      means they doenst matter
// if they are missing, means the default which means they dont matter
// null   means they must be empty
```

### Contributing

Feel free to add more Default Templates for other Folderstructures
from other software / projects / etc !!!

### Future Ideas
- Web Dashboard
- Indexing
- custom start dir for search
- dynamic templates
- faster search via coroutines

<!--

$env:CC = "zig cc"
$env:CXX = "zig c++"
$env:CGO_ENABLED = "1"
go build -x

build cmd

cd cli

go build -buildmode=c-shared -o export/finder_cli.dll
go build -buildmode=c-shared -ldflags="-s -w -trimpath" -o export/finder_cli.dll
zig cc -O3 -flto -g0 -fomit-frame-pointer -target x86_64-windows-gnu c_cli.c finder_cli.dll -o finder.exe

/* C Code */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "finder_cli.h"   // <-- dein generiertes cgo-Header (umbenennen falls anders)

//
// Hilfsfunktion: C-String in GoString konvertieren
//
GoString makeGoString(const char *s) {
    GoString gs;
    gs.p = s;
    gs.n = strlen(s);
    return gs;
}

int main(int argc, char **argv) {

    // 1) Array aus GoString erzeugen
    GoString* items = (GoString*)malloc(sizeof(GoString) * argc);
    if (!items) {
        fprintf(stderr, "malloc failed\n");
        return 1;
    }

    for (int i = 0; i < argc; i++) {
        items[i] = makeGoString(argv[i]);
    }

    // 2) GoSlice erstellen
    GoSlice slice;
    slice.data = items;  // Pointer auf das GoString-Array
    slice.len  = argc;
    slice.cap  = argc;

    // 3) Go-Funktion aufrufen
    Handle_command(slice);

    free(items);
    return 0;
}

-->
