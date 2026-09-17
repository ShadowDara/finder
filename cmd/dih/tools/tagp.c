#include "_dir_main.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int run_cmd(const char *cmd)
{
    int ret = system(cmd);
    if (ret != 0)
    {
        fprintf(stderr, "Fehler bei: %s\n", cmd);
        return 1;
    }
    return 0;
}

// Get Called from Rust
int tag_push_main(int argc, char *argv[])
{
    if (argc < 2)
    {
        fprintf(stderr, "Usage: %s <tagname>\n", argv[0]);
        return 1;
    }

    const char *tag = argv[1];

    char cmd[512];

    // 1. Tag erstellen auf HEAD
    snprintf(cmd, sizeof(cmd), "git tag %s HEAD", tag);
    if (run_cmd(cmd))
        return 1;

    // 2. Tag pushen
    snprintf(cmd, sizeof(cmd), "git push origin %s", tag);
    if (run_cmd(cmd))
        return 1;

    printf("Tag '%s' wurde erstellt und gepusht.\n", tag);

    return 0;
}
