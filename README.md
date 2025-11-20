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
