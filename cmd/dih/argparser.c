#include "argparser.h"
#include <stdio.h>

#define IDENT_SIZE 4

void argparser_help(Command *cmd)
{
    printf("Help for %s\n", cmd->name);

    if (cmd->subcommand_count > 0)
    {
        printf("\nCommands:\n");
    }

    // Make a good formmatted table
    size_t longest_name = 0;

    for (size_t i = 0; i < cmd->subcommand_count; i++)
    {
        if (strlen(cmd->subcommands[i].name) > longest_name)
        {
            longest_name = strlen(cmd->subcommands[i].name);
        }
    }

    for (size_t i = 0; i < cmd->subcommand_count; i++)
    {
        printf("  %s", cmd->subcommands[i].name);

        // Plus ident for better view
        size_t ident =
            IDENT_SIZE + longest_name - strlen(cmd->subcommands[i].name);

        for (size_t i = 0; i < ident; i++)
        {
            printf(" ");
        }

        printf("%s\n", cmd->subcommands[i].description);
    }
}
