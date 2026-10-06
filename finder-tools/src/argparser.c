#include "argparser.h"

#include <errno.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * ANSI formatting.
 *
 * This replaces the Go goansi package.
 */
#define ANSI_BOLD       "\033[1m"
#define ANSI_UNDERLINE  "\033[4m"
#define ANSI_END        "\033[0m"


 /* ============================================================
  * Internal utilities
  * ============================================================ */

static void* xmalloc(size_t size)
{
    void* ptr = malloc(size);

    if (!ptr) {
        fprintf(stderr, "argparser: out of memory\n");
        exit(EXIT_FAILURE);
    }

    return ptr;
}

static void* xrealloc(void* ptr, size_t size)
{
    void* result = realloc(ptr, size);

    if (!result) {
        fprintf(stderr, "argparser: out of memory\n");
        exit(EXIT_FAILURE);
    }

    return result;
}

static char* xstrdup(const char* str)
{
    if (!str) {
        return NULL;
    }

    size_t len = strlen(str);

    char* result = xmalloc(len + 1);

    memcpy(result, str, len + 1);

    return result;
}

static void ensure_pointer_capacity(
    void*** array,
    size_t* capacity,
    size_t count
)
{
    if (count < *capacity) {
        return;
    }

    size_t new_capacity =
        (*capacity == 0)
        ? 4
        : (*capacity * 2);

    *array = xrealloc(
        *array,
        new_capacity * sizeof(void*)
    );

    *capacity = new_capacity;
}

static void append_string(
    char*** array,
    size_t* count,
    size_t* capacity,
    const char* value
)
{
    if (*count >= *capacity) {
        size_t new_capacity =
            (*capacity == 0)
            ? 4
            : (*capacity * 2);

        *array = xrealloc(
            *array,
            new_capacity * sizeof(char*)
        );

        *capacity = new_capacity;
    }

    (*array)[*count] = xstrdup(value);
    (*count)++;
}

static bool string_equals(
    const char* a,
    const char* b
)
{
    if (!a || !b) {
        return false;
    }

    return strcmp(a, b) == 0;
}


/* ============================================================
 * Flag creation
 * ============================================================ */

static ArgFlag* flag_new(
    const char* name,
    const char* usage,
    bool required,
    ArgFlagType type
)
{
    ArgFlag* flag = xmalloc(sizeof(*flag));

    memset(flag, 0, sizeof(*flag));

    flag->name = xstrdup(name);
    flag->usage = xstrdup(usage);
    flag->required = required;
    flag->type = type;

    return flag;
}

static void flag_add_alias(
    ArgFlag* flag,
    const char* alias
)
{
    if (!alias) {
        return;
    }

    append_string(
        &flag->aliases,
        &flag->alias_count,
        &flag->alias_capacity,
        alias
    );
}

static void flag_free(ArgFlag* flag)
{
    if (!flag) {
        return;
    }

    free(flag->name);
    free(flag->usage);
    free(flag->string_value);

    for (size_t i = 0; i < flag->alias_count; ++i) {
        free(flag->aliases[i]);
    }

    free(flag->aliases);

    free(flag);
}


/* ============================================================
 * Command creation
 * ============================================================ */

ArgCommand* arg_command_new(
    const char* name,
    const char* description,
    const char* descend,
    bool hidden,
    const char** aliases,
    size_t alias_count
)
{
    ArgCommand* command = xmalloc(sizeof(*command));

    memset(command, 0, sizeof(*command));

    command->name = xstrdup(name);
    command->description = xstrdup(description);
    command->descend = xstrdup(descend);
    command->hidden = hidden;

    for (size_t i = 0; i < alias_count; ++i) {
        append_string(
            &command->aliases,
            &command->alias_count,
            &command->alias_capacity,
            aliases[i]
        );
    }

    /*
     * Equivalent to:
     *
     * cmd.Bool("help", false, "Show help", false, "h")
     */
    arg_command_bool(
        command,
        "help",
        false,
        "Show help",
        false,
        (const char* []) {
        "h"
    },
        1
    );

    return command;
}


void arg_command_free(ArgCommand* command)
{
    if (!command) {
        return;
    }

    for (size_t i = 0; i < command->flag_count; ++i) {
        flag_free(command->flags[i]);
    }

    free(command->flags);

    for (size_t i = 0; i < command->subcommand_count; ++i) {
        arg_command_free(command->subcommands[i]);
    }

    free(command->subcommands);

    for (size_t i = 0; i < command->alias_count; ++i) {
        free(command->aliases[i]);
    }

    free(command->aliases);

    for (size_t i = 0; i < command->arg_count; ++i) {
        free(command->args[i]);
    }

    free(command->args);

    free(command->name);
    free(command->description);
    free(command->descend);

    free(command);
}


/* ============================================================
 * Flag registration
 * ============================================================ */

static void command_add_flag(
    ArgCommand* command,
    ArgFlag* flag
)
{
    if (command->flag_count >= command->flag_capacity) {
        size_t new_capacity =
            command->flag_capacity == 0
            ? 4
            : command->flag_capacity * 2;

        command->flags = xrealloc(
            command->flags,
            new_capacity * sizeof(ArgFlag*)
        );

        command->flag_capacity = new_capacity;
    }

    command->flags[command->flag_count++] = flag;
}


static ArgFlag* register_flag(
    ArgCommand* command,
    const char* name,
    const char* usage,
    bool required,
    ArgFlagType type,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = flag_new(
        name,
        usage,
        required,
        type
    );

    for (size_t i = 0; i < alias_count; ++i) {
        flag_add_alias(flag, aliases[i]);
    }

    command_add_flag(command, flag);

    return flag;
}


ArgFlag* arg_command_string(
    ArgCommand* command,
    const char* name,
    const char* def,
    const char* usage,
    bool required,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = register_flag(
        command,
        name,
        usage,
        required,
        ARG_FLAG_STRING,
        aliases,
        alias_count
    );

    flag->string_value = xstrdup(def);

    return flag;
}


ArgFlag* arg_command_global_string(
    ArgCommand* command,
    const char* name,
    const char* def,
    const char* usage,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = register_flag(
        command,
        name,
        usage,
        false,
        ARG_FLAG_STRING,
        aliases,
        alias_count
    );

    flag->string_value = xstrdup(def);
    flag->global = true;

    return flag;
}


ArgFlag* arg_command_bool(
    ArgCommand* command,
    const char* name,
    bool def,
    const char* usage,
    bool required,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = register_flag(
        command,
        name,
        usage,
        required,
        ARG_FLAG_BOOL,
        aliases,
        alias_count
    );

    flag->bool_value = def;

    return flag;
}


ArgFlag* arg_command_global_bool(
    ArgCommand* command,
    const char* name,
    bool def,
    const char* usage,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = arg_command_bool(
        command,
        name,
        def,
        usage,
        false,
        aliases,
        alias_count
    );

    flag->global = true;

    return flag;
}


ArgFlag* arg_command_number(
    ArgCommand* command,
    const char* name,
    int64_t def,
    const char* usage,
    bool required,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = register_flag(
        command,
        name,
        usage,
        required,
        ARG_FLAG_NUMBER,
        aliases,
        alias_count
    );

    flag->number_value = def;

    return flag;
}


ArgFlag* arg_command_global_number(
    ArgCommand* command,
    const char* name,
    int64_t def,
    const char* usage,
    const char** aliases,
    size_t alias_count
)
{
    ArgFlag* flag = arg_command_number(
        command,
        name,
        def,
        usage,
        false,
        aliases,
        alias_count
    );

    flag->global = true;

    return flag;
}


/* ============================================================
 * Subcommands
 * ============================================================ */

void arg_command_add_subcommand(
    ArgCommand* command,
    ArgCommand* subcommand
)
{
    if (!command || !subcommand) {
        return;
    }

    subcommand->parent = command;

    if (command->subcommand_count >=
        command->subcommand_capacity)
    {
        size_t new_capacity =
            command->subcommand_capacity == 0
            ? 4
            : command->subcommand_capacity * 2;

        command->subcommands = xrealloc(
            command->subcommands,
            new_capacity * sizeof(ArgCommand*)
        );

        command->subcommand_capacity = new_capacity;
    }

    command->subcommands[
        command->subcommand_count++
    ] = subcommand;
}


/* ============================================================
 * Flag lookup
 * ============================================================ */

static ArgFlag* find_flag(
    ArgCommand* command,
    const char* key
)
{
    if (!command || !key) {
        return NULL;
    }

    for (size_t i = 0; i < command->flag_count; ++i) {
        ArgFlag* flag = command->flags[i];

        if (string_equals(flag->name, key)) {
            return flag;
        }

        for (size_t j = 0; j < flag->alias_count; ++j) {
            if (string_equals(flag->aliases[j], key)) {
                return flag;
            }
        }
    }

    return NULL;
}


static ArgFlag* find_global_flag(
    ArgCommand* command,
    const char* key
)
{
    if (!command) {
        return NULL;
    }

    if (command->parent) {
        ArgFlag* flag =
            find_flag(command->parent, key);

        if (flag && flag->global) {
            return flag;
        }

        return find_global_flag(
            command->parent,
            key
        );
    }

    return NULL;
}


static ArgFlag* find_available_flag(
    ArgCommand* command,
    const char* key
)
{
    /*
     * Local flags always have priority.
     */
    ArgFlag* flag = find_flag(command, key);

    if (flag) {
        return flag;
    }

    return find_global_flag(command, key);
}


/* ============================================================
 * Subcommand lookup
 * ============================================================ */

static ArgCommand* find_subcommand(
    ArgCommand* command,
    const char* key
)
{
    if (!command || !key) {
        return NULL;
    }

    for (size_t i = 0;
        i < command->subcommand_count;
        ++i)
    {
        ArgCommand* sub =
            command->subcommands[i];

        if (string_equals(sub->name, key)) {
            return sub;
        }

        for (size_t j = 0;
            j < sub->alias_count;
            ++j)
        {
            if (string_equals(
                sub->aliases[j],
                key))
            {
                return sub;
            }
        }
    }

    return NULL;
}


/* ============================================================
 * Argument handling
 * ============================================================ */

static void command_add_positional(
    ArgCommand* command,
    const char* value
)
{
    append_string(
        &command->args,
        &command->arg_count,
        &command->arg_capacity,
        value
    );
}


static bool parse_number(
    const char* value,
    int64_t* result
)
{
    if (!value || !result) {
        return false;
    }

    char* end = NULL;

    errno = 0;

    long long parsed =
        strtoll(value, &end, 10);

    if (errno != 0 ||
        end == value ||
        *end != '\0')
    {
        return false;
    }

    *result = (int64_t)parsed;

    return true;
}


static void set_flag_value(
    ArgFlag* flag,
    const char* value
)
{
    if (!flag) {
        return;
    }

    if (flag->type == ARG_FLAG_BOOL) {
        flag->bool_value = true;
        flag->set = true;
        return;
    }

    if (!value) {
        return;
    }

    if (flag->type == ARG_FLAG_NUMBER) {
        int64_t number;

        if (parse_number(value, &number)) {
            flag->number_value = number;
            flag->set = true;
        }

        return;
    }

    free(flag->string_value);

    flag->string_value = xstrdup(value);
    flag->set = true;
}


/* ============================================================
 * Required flags
 * ============================================================ */

static void validate_required(
    ArgCommand* command
)
{
    for (size_t i = 0;
        i < command->flag_count;
        ++i)
    {
        ArgFlag* flag =
            command->flags[i];

        if (flag->required && !flag->set) {
            printf(
                "Missing required flag: --%s\n\n",
                flag->name
            );

            arg_command_print_help(command);

            exit(EXIT_FAILURE);
        }
    }
}


/* ============================================================
 * Parse
 * ============================================================ */

ArgCommand* arg_command_parse(
    ArgCommand* command,
    int argc,
    char** argv
)
{
    if (!command) {
        return NULL;
    }

    if (command->pass_through) {
        for (int i = 0; i < argc; ++i) {
            command_add_positional(
                command,
                argv[i]
            );
        }

        return command;
    }

    for (int i = 0; i < argc; ++i) {
        char* arg = argv[i];

        /*
         * ----------------------------------------------------
         * Long flags
         * ----------------------------------------------------
         */

        if (strncmp(arg, "--", 2) == 0) {
            char* key = arg + 2;

            /*
             * --key=value
             */
            char* equals = strchr(key, '=');

            if (equals) {
                size_t key_len =
                    (size_t)(equals - key);

                char* name =
                    xmalloc(key_len + 1);

                memcpy(name, key, key_len);
                name[key_len] = '\0';

                const char* value =
                    equals + 1;

                ArgFlag* flag =
                    find_available_flag(
                        command,
                        name
                    );

                if (flag &&
                    flag->type != ARG_FLAG_BOOL)
                {
                    set_flag_value(
                        flag,
                        value
                    );
                }

                free(name);

                continue;
            }

            /*
             * --key
             */
            ArgFlag* flag =
                find_available_flag(
                    command,
                    key
                );

            if (flag) {
                if (flag->type == ARG_FLAG_BOOL) {
                    flag->bool_value = true;
                    flag->set = true;
                }
                else if (i + 1 < argc) {
                    set_flag_value(
                        flag,
                        argv[i + 1]
                    );

                    i++;
                }

                continue;
            }
        }


        /*
         * ----------------------------------------------------
         * Short flags
         * ----------------------------------------------------
         *
         * Exactly like the Go implementation:
         *
         *   -v
         *   -n John
         *
         * Only exactly two characters are recognized.
         */

        if (arg[0] == '-' &&
            arg[1] != '\0' &&
            arg[2] == '\0')
        {
            const char* key = arg + 1;

            ArgFlag* flag =
                find_available_flag(
                    command,
                    key
                );

            if (flag) {
                if (flag->type == ARG_FLAG_BOOL) {
                    flag->bool_value = true;
                    flag->set = true;
                }
                else if (i + 1 < argc) {
                    set_flag_value(
                        flag,
                        argv[i + 1]
                    );

                    i++;
                }

                continue;
            }
        }


        /*
         * ----------------------------------------------------
         * Subcommand
         * ----------------------------------------------------
         */

        ArgCommand* sub =
            find_subcommand(command, arg);

        if (sub) {
            return arg_command_parse(
                sub,
                argc - i - 1,
                argv + i + 1
            );
        }


        /*
         * ----------------------------------------------------
         * Positional argument
         * ----------------------------------------------------
         */

        command_add_positional(
            command,
            arg
        );
    }


    /*
     * --------------------------------------------------------
     * Help
     * --------------------------------------------------------
     *
     * Equivalent to:
     *
     * if f := c.findFlag("help"); f != nil && f.BoolValue {
     *     c.PrintHelp()
     *     os.Exit(0)
     * }
     */

    ArgFlag* help =
        find_flag(command, "help");

    if (help && help->bool_value) {
        arg_command_print_help(command);
        exit(EXIT_SUCCESS);
    }


    /*
     * --------------------------------------------------------
     * Required flags
     * --------------------------------------------------------
     */

    validate_required(command);

    return command;
}


/* ============================================================
 * Accessors
 * ============================================================ */

const char* arg_command_get_string(
    ArgCommand* command,
    const char* name
)
{
    ArgFlag* flag =
        find_available_flag(command, name);

    if (!flag ||
        flag->type != ARG_FLAG_STRING)
    {
        return "";
    }

    return flag->string_value
        ? flag->string_value
        : "";
}


int64_t arg_command_get_number(
    ArgCommand* command,
    const char* name
)
{
    ArgFlag* flag =
        find_available_flag(command, name);

    if (!flag ||
        flag->type != ARG_FLAG_NUMBER)
    {
        return 0;
    }

    return flag->number_value;
}


bool arg_command_get_bool(
    ArgCommand* command,
    const char* name
)
{
    ArgFlag* flag =
        find_available_flag(command, name);

    if (!flag ||
        flag->type != ARG_FLAG_BOOL)
    {
        return false;
    }

    return flag->bool_value;
}


/* ============================================================
 * Full command path
 * ============================================================ */

static void print_command_path(
    ArgCommand* command
)
{
    if (!command) {
        return;
    }

    if (command->parent) {
        print_command_path(command->parent);
        printf(" %s", command->name);
    }
    else {
        /*
         * The Go implementation uses os.Args[0].
         *
         * In C we don't have argv[0] stored in the command,
         * therefore the root command name is used here.
         */
        printf("%s", command->name);
    }
}


/* ============================================================
 * Global flags
 * ============================================================ */

static void collect_global_flags(
    ArgCommand* command,
    ArgFlag*** result,
    size_t* count,
    size_t* capacity
)
{
    if (!command) {
        return;
    }

    collect_global_flags(
        command->parent,
        result,
        count,
        capacity
    );

    for (size_t i = 0;
        i < command->flag_count;
        ++i)
    {
        ArgFlag* flag =
            command->flags[i];

        if (!flag->global) {
            continue;
        }

        if (*count >= *capacity) {
            size_t new_capacity =
                (*capacity == 0)
                ? 4
                : (*capacity * 2);

            *result = xrealloc(
                *result,
                new_capacity * sizeof(ArgFlag*)
            );

            *capacity = new_capacity;
        }

        (*result)[(*count)++] = flag;
    }
}


/* ============================================================
 * Help
 * ============================================================ */

static void print_flag(
    ArgFlag* flag
)
{
    printf(
        "  %s--%s",
        ANSI_BOLD,
        flag->name
    );

    if (flag->alias_count > 0) {
        printf(" (-");

        for (size_t i = 0;
            i < flag->alias_count;
            ++i)
        {
            if (i > 0) {
                printf(", -");
            }

            printf("%s", flag->aliases[i]);
        }

        printf(")");
    }

    if (flag->required) {
        printf(" [required]");
    }

    printf(
        "%s\t%s\n",
        ANSI_END,
        flag->usage
        ? flag->usage
        : ""
    );
}


void arg_command_print_help(
    ArgCommand* command
)
{
    if (!command) {
        return;
    }

    /*
     * Usage
     */

    printf(
        "%s%sUsage:%s\n  ",
        ANSI_BOLD,
        ANSI_UNDERLINE,
        ANSI_END
    );

    print_command_path(command);

    printf(
        " [subcommands] [options] [global options]\n\n"
    );


    /*
     * Description
     */

    if (command->description &&
        command->description[0] != '\0')
    {
        printf(
            "%s\n\n",
            command->description
        );
    }


    /*
     * Subcommands
     */

    if (command->subcommand_count > 0) {
        printf(
            "%s%sSubcommands:%s\n",
            ANSI_BOLD,
            ANSI_UNDERLINE,
            ANSI_END
        );

        for (size_t i = 0;
            i < command->subcommand_count;
            ++i)
        {
            ArgCommand* sub =
                command->subcommands[i];

            if (sub->hidden) {
                continue;
            }

            printf(
                "  %s%s",
                ANSI_BOLD,
                sub->name
            );

            if (sub->alias_count > 0) {
                printf(" (");

                for (size_t j = 0;
                    j < sub->alias_count;
                    ++j)
                {
                    if (j > 0) {
                        printf(", ");
                    }

                    printf(
                        "%s",
                        sub->aliases[j]
                    );
                }

                printf(")");
            }

            printf(
                "%s\t%s\n",
                ANSI_END,
                sub->description
                ? sub->description
                : ""
            );
        }

        printf("\n");
    }


    /*
     * Local options
     */

    bool has_local_flags = false;

    for (size_t i = 0;
        i < command->flag_count;
        ++i)
    {
        if (!command->flags[i]->global) {
            has_local_flags = true;
            break;
        }
    }

    if (has_local_flags) {
        printf(
            "%s%sOptions:%s\n",
            ANSI_BOLD,
            ANSI_UNDERLINE,
            ANSI_END
        );

        for (size_t i = 0;
            i < command->flag_count;
            ++i)
        {
            ArgFlag* flag =
                command->flags[i];

            if (flag->global) {
                continue;
            }

            print_flag(flag);
        }

        printf("\n");
    }


    /*
     * Global options
     */

    ArgFlag** global_flags = NULL;
    size_t global_count = 0;
    size_t global_capacity = 0;

    collect_global_flags(
        command,
        &global_flags,
        &global_count,
        &global_capacity
    );

    if (global_count > 0) {
        printf(
            "%s%sGlobal Options:%s\n",
            ANSI_BOLD,
            ANSI_UNDERLINE,
            ANSI_END
        );

        for (size_t i = 0;
            i < global_count;
            ++i)
        {
            print_flag(global_flags[i]);
        }

        printf("\n");
    }

    free(global_flags);


    /*
     * Descend
     */

    if (command->descend) {
        printf(
            "%s\n",
            command->descend
        );
    }
}


/* ============================================================
 * Positional arguments
 * ============================================================ */

size_t arg_command_arg_count(
    ArgCommand* command
)
{
    if (!command) {
        return 0;
    }

    return command->arg_count;
}


const char* arg_command_arg(
    ArgCommand* command,
    size_t index
)
{
    if (!command ||
        index >= command->arg_count)
    {
        return NULL;
    }

    return command->args[index];
}


/* ============================================================
 * PassThrough
 * ============================================================ */

void arg_command_set_pass_through(
    ArgCommand* command,
    bool enabled
)
{
    if (command) {
        command->pass_through = enabled;
    }
}
