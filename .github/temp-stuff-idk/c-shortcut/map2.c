
#include <stdlib.h>
#include <string.h>


typedef struct
{
    char *key;
    char *value;
} Entry;

typedef struct
{
    size_t maxsize;
    size_t count;
    Entry entries[];
} Map;

// Creates a new Map
Map *newMap(size_t size)
{
    Map *map = (Map *)malloc(sizeof(Map) + size * sizeof(Entry *));

    if (map == NULL)
    {
        return NULL;
    }

    map->count = 0;
    map->maxsize = size;

    return map;
}

const char *map_get(Map *map, const char *key)
{
    if (map == NULL || key == NULL)
    {
        return NULL;
    }

    for (size_t i = 0; i < map->count; i++)
    {
        if (strcmp(map->entries[i].key, key) == 0)
            return map->entries[i].value;
    }

    return NULL;
}

void map_put(Map *map, const char *key, const char *value)
{
    if (map->count >= map->maxsize)
        return;

    map->entries[map->count].key = strdup(key);
    map->entries[map->count].value = strdup(value);
    map->count++;
}

void map_free(Map *map)
{
    for (size_t i = 0; i < map->count; i++)
    {
        free(map->entries[i].key);
        free(map->entries[i].value);
    }

    free(map);
}
