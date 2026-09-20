#pragma once

#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_DEPTH 100

/*

# This is a Comment

server
    host "localhost"
    port 8080
    debug
        idk lol lol

database
    name "myapp"
    pool 10

more
    lol this is string
    lol2 "this is string too"
    lol3 "and this is a string too"

 */

typedef struct Value Value;
typedef struct Object Object;
typedef struct Entry Entry;

struct Object {
  char *key;
  Value *val;
  size_t objcount;
};

enum ValueType { VALUE_STR, VALIE_OBJECT };

struct Value {
  char *key;

  enum ValueType type;

  union {
    char *str;
    Object *obj;
  };
};

struct Entry {
  size_t indent;
  char *key;
  char *value;
};

// Print a cafa object to the terminal
size_t cafa_to_string(const Object *obj, char *buffer, size_t size,
                      size_t indent, size_t offset);

Object *parse_cafa(char *input);

const Value *object_get(const Object *obj, const char *key);

const char *object_get_string(const Object *obj, const char *key);

const Object *object_get_object(const Object *obj, const char *key);
