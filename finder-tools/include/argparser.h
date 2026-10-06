#ifndef ARG_PARSER_H
#define ARG_PARSER_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

    /*
     * Lightweight command-line argument parser.
     *
     * Supported:
     *   --name John
     *   --name=John
     *   -n John
     *   --verbose
     *   -v
     *   subcommands
     *   subcommand aliases
     *   global flags
     *   positional arguments
     *   required flags
     *   --help / -h
     *
     * Global flags must appear AFTER the subcommand:
     *
     *   app user --verbose
     *   app user create --verbose
     *
     * They do NOT work before the subcommand:
     *
     *   app --verbose user
     */

    typedef enum {
        ARG_FLAG_STRING,
        ARG_FLAG_NUMBER,
        ARG_FLAG_BOOL
    } ArgFlagType;

    typedef struct ArgFlag {
        char* name;

        char** aliases;
        size_t alias_count;
        size_t alias_capacity;

        char* usage;

        bool required;

        int64_t number_value;
        char* string_value;
        bool bool_value;

        ArgFlagType type;

        bool set;
        bool global;
    } ArgFlag;

    typedef struct ArgCommand ArgCommand;

    struct ArgCommand {
        char* name;
        bool hidden;

        char** aliases;
        size_t alias_count;
        size_t alias_capacity;

        char* description;
        char* descend;

        ArgFlag** flags;
        size_t flag_count;
        size_t flag_capacity;

        ArgCommand** subcommands;
        size_t subcommand_count;
        size_t subcommand_capacity;

        ArgCommand* parent;

        char** args;
        size_t arg_count;
        size_t arg_capacity;

        bool pass_through;
    };

    /*
     * Creates a new command.
     *
     * Automatically registers:
     *
     *   --help
     *   -h
     */
    ArgCommand* arg_command_new(
        const char* name,
        const char* description,
        const char* descend,
        bool hidden,
        const char** aliases,
        size_t alias_count
    );

    void arg_command_free(ArgCommand* command);

    /*
     * Flag registration.
     */
    ArgFlag* arg_command_string(
        ArgCommand* command,
        const char* name,
        const char* def,
        const char* usage,
        bool required,
        const char** aliases,
        size_t alias_count
    );

    ArgFlag* arg_command_global_string(
        ArgCommand* command,
        const char* name,
        const char* def,
        const char* usage,
        const char** aliases,
        size_t alias_count
    );

    ArgFlag* arg_command_bool(
        ArgCommand* command,
        const char* name,
        bool def,
        const char* usage,
        bool required,
        const char** aliases,
        size_t alias_count
    );

    ArgFlag* arg_command_global_bool(
        ArgCommand* command,
        const char* name,
        bool def,
        const char* usage,
        const char** aliases,
        size_t alias_count
    );

    ArgFlag* arg_command_number(
        ArgCommand* command,
        const char* name,
        int64_t def,
        const char* usage,
        bool required,
        const char** aliases,
        size_t alias_count
    );

    ArgFlag* arg_command_global_number(
        ArgCommand* command,
        const char* name,
        int64_t def,
        const char* usage,
        const char** aliases,
        size_t alias_count
    );

    /*
     * Adds a subcommand.
     */
    void arg_command_add_subcommand(
        ArgCommand* command,
        ArgCommand* subcommand
    );

    /*
     * Parse command line arguments.
     *
     * Returns the command that was finally selected.
     *
     * argc/argv are expected to contain the arguments AFTER argv[0].
     *
     * Example:
     *
     *   app user create --verbose
     *
     *   arg_command_parse(root, argc - 1, argv + 1);
     */
    ArgCommand* arg_command_parse(
        ArgCommand* command,
        int argc,
        char** argv
    );

    /*
     * Value accessors.
     */
    const char* arg_command_get_string(
        ArgCommand* command,
        const char* name
    );

    int64_t arg_command_get_number(
        ArgCommand* command,
        const char* name
    );

    bool arg_command_get_bool(
        ArgCommand* command,
        const char* name
    );

    /*
     * Prints help.
     */
    void arg_command_print_help(ArgCommand* command);

    /*
     * Returns the number of positional arguments.
     */
    size_t arg_command_arg_count(
        ArgCommand* command
    );

    /*
     * Returns positional argument at index.
     */
    const char* arg_command_arg(
        ArgCommand* command,
        size_t index
    );

    /*
     * Enable/disable pass-through mode.
     */
    void arg_command_set_pass_through(
        ArgCommand* command,
        bool enabled
    );

#ifdef __cplusplus
}
#endif

#endif /* ARG_PARSER_H */
