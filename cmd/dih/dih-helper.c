#include "dih-helper.h"

int handle_init() { printf("init\n"); }

int handle_build() { printf("build\n"); }

int handle_run(int argc, const char **argv) {
  printf("run\n");
  for (size_t i = 0; i < argc; i++) {
    printf("%s\n", argv[i]);
  }
}

int handle_help() {
  printf("Help\n"
         "This is the help message for dih, a small C cli tool\n"
         "lol\n");
}

int handle_cmo(int argc, const char **argv) { return cmo_main(); }

int handle_tagp(int argc, const char **argv) {
  return tag_push_main(argc, argv);
}

int handle_ign(int argc, const char **argv) { return ign_main(argc, argv); }
