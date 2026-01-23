# finder

a simple go program to search for certain folderstructures

**Please Open an Issue if one of the precreated Folder Structs is not
specific enough and returns wrong projects!!!**

### Usage

```sh
finder git
```

and the programm will search for all folder which do have a *.git*
directory.

### INFO

- programm only uses **`.json5`** files

### Path for custom structs
```js
// Windows → %AppData%\finder
// Linux   → ~/.config/finder
// macOS   → ~/Library/Application Support/finder
```
create a new struct there to search then for it via

```sh
finder <struct-name>
```

### Folderstruct

```json5
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

// if they are missing, means the default which means they dont matter
```

### Contributing

Feel free to add more Default Templates for other Folderstructures
from other software / projects / etc !!!

### TODO
- View Command
- Custom Template Folder / Loader
- switch from JSON5 to JSON
- add description field to every JSON File
- add JSON Shema

### Future Ideas
- Web Dashboard
- change or add project name via command line
- description to the structs
- dynamic templates
- Indexing
- custom start dir for search
- faster search via coroutines
- add check comments in directories (to check for example for git repositories
which have uncomitted files)
- enable Caching

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
