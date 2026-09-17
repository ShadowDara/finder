#include <stdio.h>
#include <string.h>

// add argparser
#include "ansicolors.h"
#include "argparser.h"
#include "dih-helper.h"
#include "info.h"

// for subcommand count
#define ARRAY_COUNT(arr) (sizeof(arr) / sizeof((arr)[0]))

int cli(int argc, const char *argv[])
{
    SubCommand subcommands[] = {
        {"help", handle_help}, {"init", handle_init}, {"build", handle_build},
        {"run", handle_run},   {"m", handle_cmo},     {"ign", handle_ign},
    };

    Command command = {.name = "dih",
                       .subcommands = subcommands,
                       .subcommand_count = ARRAY_COUNT(subcommands)};

    if (argc >= 2)
    {
        for (size_t i = 0; i < command.subcommand_count; i++)
        {
            if (strcmp(argv[1], command.subcommands[i].name) == 0)
            {
                return command.subcommands[i].handler(argc - 2, argv + 2);
            }
        }
    }

    return 1;
}

int main(int argc, const char *argv[])
{
    // printf("dih is mini tool in C which will be shipped with finder");

    return cli(argc, argv);
}
