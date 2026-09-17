#pragma once

// argparser lib for C

#include <stddef.h>

// struct for a Subcommand in the argparser

typedef struct
{
    const char *name;

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
