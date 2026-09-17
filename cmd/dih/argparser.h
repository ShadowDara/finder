#pragma once

// argparser lib for C

#include "ansicolors.h"

#include <stddef.h>
#include <stdio.h>
#include <string.h>

// struct for a Subcommand in the argparser

typedef struct
{
    const char *name;
    const char *description;

    // function pointer which gets argc and argv as an argument
    int (*handler)(int argc, char **argv);
} SubCommand;

typedef struct
{
    const char *name;

    // Pointer auf Array
    SubCommand *subcommands;

    // Anzahl Array Elemente
    size_t subcommand_count;
} Command;

void argparser_help(Command *cmd);
