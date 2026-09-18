#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*

server
    host "localhost"
    port 8080
    debug

database
    name "myapp"
    pool 10

 */

typedef struct Value Value;
typedef struct Object Object;
typedef struct Entry Entry;

struct Object
{
    char *key;
    Value *val;
    size_t objcount;
};

enum ValueType
{
    VALUE_STR,
    VALIE_OBJECT
};

struct Value
{
    char *key;

    enum ValueType type;

    union
    {
        const char *str;
        const Object *obj;
    };
};

struct Entry
{
    size_t indent;
    char *key;
    char *value;
};

void insert_key(Object *obj, char *name)
{
    obj->val = malloc(sizeof(Value));

    obj->objcount++;
}

Object *parse_cafa(char *input)
{
    // Allocate memory
    Object *root = malloc(sizeof *root);

    // NULL CHECK
    if (root == NULL)
    {
        return NULL;
    }

    Entry *entries = NULL;
    size_t entries_count = 0;

    root->key = NULL;
    root->val = NULL;
    root->objcount = 0;

    char *token = strtok(input, "\n");

    char *current_top;

    while (token != NULL)
    {
        // Indent Size bekommen
        size_t ident = 0;

        while (token[ident] == ' ' || token[ident] == '\t')
        {
            ident++;
        }

        char *p = token + ident;

        /* Empty line */
        if (*p == '\0')
        {
            token = strtok(NULL, "\n");
            continue;
        }

        char *key = p;

        while (*p != '\0' && !isspace((unsigned char)*p))
        {
            p++;
        }

        /* End of Key */
        if (*p != '\0')
        {
            *p++ = '\0';
        }

        /* whitespace before value */
        while (*p == ' ' || *p == '\t')
        {
            p++;
        }

        Entry *tmp = realloc(entries, (entries_count + 1) * sizeof *entries);

        if (tmp == NULL)
        {
            free(entries);
            return NULL;
        }

        entries = tmp;

        entries[entries_count].indent = ident;
        entries[entries_count].key = key;
        entries[entries_count].value = (*p == '\0') ? NULL : p;

        entries_count++;

        token = strtok(NULL, "\n");
    }

    for (size_t i = 0; i < entries_count; i++)
    {
        printf("%zu %s %s\n", entries[i].indent, entries[i].key,
               entries[i].value);
    }

    return NULL;
}

int main()
{
    char input[] = "server\n\thost \"localhost\"\n\tport 8080\n\tidk\n\t\tlol "
                   "\"hallo\"\ndb\n";
    char input2[] = "server\n"
                    "\thost \"localhost\"\n"
                    "\tport 8080\n"
                    "\tdebug\n"
                    "\n"
                    "database\n"
                    "\tname \"myapp\"\n"
                    "\tpool 10\n";
    printf("%s\n\n", input);
    parse_cafa(input);

    //    debug

    // database
    //     name "myapp"
    //     pool 10
    return 0;
}
