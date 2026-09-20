#include "cafa.h"

void insert_key(Object *obj, Entry entry) {
  Value *tmp = realloc(obj->val, (obj->objcount + 1) * sizeof *obj->val);

  if (tmp == NULL) {
    return;
  }

  obj->val = tmp;

  Value *value = &obj->val[obj->objcount];

  value->key = entry.key;

  if (entry.value == NULL) {
    value->type = VALIE_OBJECT;
    value->obj = NULL;
  } else {
    value->type = VALUE_STR;
    value->str = entry.value;
  }

  obj->objcount++;
}

// Create a cafa object
Object *create_object(char *key) {
  Object *obj = malloc(sizeof *obj);

  if (obj == NULL) {
    return NULL;
  }

  obj->key = key;
  obj->val = NULL;
  obj->objcount = 0;

  return obj;
}

// Insert a string into an cafa object
void insert_string(Object *obj, char *key, char *str) {
  Value *tmp = realloc(obj->val, (obj->objcount + 1) * sizeof *obj->val);

  if (tmp == NULL) {
    return;
  }

  obj->val = tmp;

  Value *value = &obj->val[obj->objcount];

  value->key = key;
  value->type = VALUE_STR;
  value->str = str;

  obj->objcount++;
}

// Insert an object into cafa
void insert_object(Object *parent, Object *child) {
  Value *tmp =
      realloc(parent->val, (parent->objcount + 1) * sizeof *parent->val);

  if (tmp == NULL) {
    return;
  }

  parent->val = tmp;

  Value *value = &parent->val[parent->objcount];

  value->key = child->key;
  value->type = VALIE_OBJECT;
  value->obj = child;

  parent->objcount++;
}

void insert_entries(Object *root, Entry *entries, size_t entries_count) {
  Object *parents[MAX_DEPTH] = {0};

  for (size_t i = 0; i < entries_count; i++) {
    // store the current entry
    Entry *entry = &entries[i];

    // Check if the entry has an value
    if (entry->value != NULL) {
      // normaler String-Wert
      if (entry->value != NULL) {
        Object *parent = parents[entry->indent - 1];

        // Insert the string
        insert_string(parent, entry->key, entry->value);
      } else {
        // Insert the string
        insert_string(root, entry->key, entry->value);
      }
    } else {
      // new child object
      Object *child = create_object(entry->key);

      if (child == NULL) {
        return;
      }

      if (entry->indent == 0) {
        insert_object(root, child);
      } else {
        // get the parent at the previous indentation level
        Object *parent = parents[entry->indent - 1];

        insert_object(parent, child);
      }

      // add the child to the tree
      parents[entry->indent] = child;
    }
  }
}

// Print ident to print cafa
void print_indent(size_t indent) {
  for (size_t i = 0; i < indent; i++) {
    printf(" ");
  }
}

// Print a cafa object to the terminal
size_t cafa_to_string(const Object *obj, char *buffer, size_t size,
                      size_t indent, size_t offset) {
  for (size_t i = 0; i < obj->objcount; i++) {
    for (size_t j = 0; j < indent; j++) {
      offset += snprintf(buffer + offset, size - offset, " ");
    }

    offset += snprintf(buffer + offset, size - offset, "%s", obj->val[i].key);

    if (obj->val[i].type == VALUE_STR) {
      offset += snprintf(buffer + offset, size - offset, " \"%s\"\n",
                         obj->val[i].str);
    }

    if (obj->val[i].type == VALIE_OBJECT) {
      offset += snprintf(buffer + offset, size - offset, "\n");

      offset =
          cafa_to_string(obj->val[i].obj, buffer, size, indent + 4, offset);
    }
  }

  return offset;
}

Object *parse_cafa(char *input) {
  // Allocate memory
  Object *root = create_object("root");

  // NULL CHECK
  if (root == NULL) {
    return NULL;
  }

  Entry *entries = NULL;
  size_t entries_count = 0;

  root->key = NULL;
  root->val = NULL;
  root->objcount = 0;

  char *token = strtok(input, "\n");

  char *current_top;

  while (token != NULL) {
    // Indent Size bekommen
    size_t ident = 0;

    while (token[ident] == ' ' || token[ident] == '\t') {
      ident++;
    }

    char *p = token + ident;

    /* Empty line */
    if (*p == '\0') {
      token = strtok(NULL, "\n");
      continue;
    }

    char *key = p;

    while (*p != '\0' && !isspace((unsigned char)*p)) {
      p++;
    }

    /* End of Key */
    if (*p != '\0') {
      *p++ = '\0';
    }

    /* whitespace before value */
    while (*p == ' ' || *p == '\t') {
      p++;
    }

    Entry *tmp = realloc(entries, (entries_count + 1) * sizeof *entries);

    if (tmp == NULL) {
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

  // for (size_t i = 0; i < entries_count; i++)
  // {
  //     printf("%zu %s %s\n", entries[i].indent, entries[i].key,
  //            entries[i].value);
  //     // insert_key(root, entries[i]);
  // }

  insert_entries(root, entries, entries_count);

  free(entries);

  return root;
}

const Value *object_get(const Object *obj, const char *key) {
  for (size_t i = 0; i < obj->objcount; i++) {
    if (strcmp(obj->val[i].key, key) == 0) {
      return &obj->val[i];
    }
  }

  return NULL;
}

const char *object_get_string(const Object *obj, const char *key) {
  const Value *value = object_get(obj, key);

  if (value == NULL) {
    return NULL;
  }

  if (value->type != VALUE_STR) {
    return NULL;
  }

  return value->str;
}

const Object *object_get_object(const Object *obj, const char *key) {
  const Value *value = object_get(obj, key);

  if (value == NULL) {
    return NULL;
  }

  if (value->type != VALIE_OBJECT) {
    return NULL;
  }

  return value->obj;
}

#ifdef CAFA_MAIN

int main() {
  char input[] = "server\n\thost \"localhost\"\n\tport 8080\n\tidk\n\t\tlol "
                 "\"hallo\"\ndb\n\tlol lolol ll\n";

  char input2[] = "server\n"
                  "\thost \"localhost\"\n"
                  "\tport 8080\n"
                  "\tdebug\n"
                  "\n"
                  "database\n"
                  "\tname \"myapp\"\n"
                  "\tpool 10\n";
  // printf("%s\n\n", input);

  Object *cafa = parse_cafa(input);

  char buffer[1024];

  cafa_to_string(cafa, buffer, sizeof buffer, 0, 0);

  printf("%s", buffer);

  printf("\n");

  char buffer2[1024];

  cafa_to_string(object_get_object(cafa, "server"), buffer2, sizeof buffer, 0,
                 0);

  printf("%s", buffer2);

  // Object *root = create_object(NULL);

  // Object *server = create_object("server");

  // insert_object(root, server);

  // insert_string(server, "host", "\"localhost\"");
  // insert_string(server, "port", "8080");
  // insert_string(server, "debug", NULL);

  // cafa_to_string(root, 0);

  return 0;
}

#endif
