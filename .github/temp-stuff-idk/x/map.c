
#include <string.h>
#include <stdlib.h>

#define MAX_ENTRIES 3000

typedef struct
{
    char *key;
    char *value;
} Entry;

typedef struct
{
    Entry entries[MAX_ENTRIES];
    size_t count;
} Map;

const char *map_get(Map *map, const char *key)
{
    for (size_t i = 0; i < map->count; i++)
    {
        if (strcmp(map->entries[i].key, key) == 0)
            return map->entries[i].value;
    }

    return NULL;
}

void map_put(Map *map, const char *key, const char *value)
{
    if (map->count >= MAX_ENTRIES)
        return;

    map->entries[map->count].key = _strdup(key);
    map->entries[map->count].value = _strdup(value);
    map->count++;
}

void map_free(Map *map)
{
    for (size_t i = 0; i < map->count; i++)
    {
        free(map->entries[i].key);
        free(map->entries[i].value);
    }

    map->count = 0;
}
