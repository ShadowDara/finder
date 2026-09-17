// Gitignore Adder
//
// A small C program that adds entries to the .gitignore file of a Git
// repository via the command line. It recursively searches for the .git folder,
// creates a .gitignore if necessary, and appends the arguments as new lines.

#include "../ansicolors.h"
#include "../lib/oscore.h"
#include <stdio.h>
#include <string.h> // for strcmp

// Prints a help message
int help()
{
    printf(
        "GitIgnore-Adder\n"
        "Adds entries to the .gitignore of a Git repository.\n"
        "Usage: ./git-ign <entry1> <entry2> ...\n"
        "Example: ./git-ign build/ temp.log\n"
        "-h shows this help.\n"
        "\n"
        "More Infos are here:\n"
        "https://samengine.vercel.app/r/p/ign\n"
        "https://samengine.js.org/r/p/ign\n"
        "https://github.com/shadowdara/samengine#ign\n"
        "\n"
        "This is the Version from cargo, there are other executables\n"
        "in the package too:\n" GREEN "git-tagp" END
        "   to create a tag and push it\n" GREEN "git-tags" END
        "   to save all tags into a txt File\n" GREEN "viewb   " END
        "   to view the selected branch for every git repository in the "
        "directory\n" GREEN "unpush  " END
        "   to check for unpushed changes on every branch in the repository\n");
    return 0;
}

// Checks if a file exists (returns 1 if it exists, 0 if not)
int file_exists(const char *filename)
{
    FILE *file = fopen(filename, "r");
    if (file)
    {
        fclose(file);
        return 1;
    }
    return 0;
}

void normalize_path(char *path)
{
    for (int i = 0; path[i]; i++)
    {
        if (path[i] == '\\')
        {
            path[i] = '/';
        }
    }
}

int make_relative(const char *base, const char *full, char *out, int out_len)
{
    size_t base_len = strlen(base);

    // wenn base kein Prefix von full ist → Fehler
    if (strncmp(base, full, base_len) != 0)
    {
        return 0;
    }

    const char *relative = full + base_len;

    // führenden Slash entfernen
    if (*relative == PATH_SEPARATOR[0])
    {
        relative++;
    }

    snprintf(out, out_len, "%s", relative);
    return 1;
}

// Recursively searches for the .git folder upwards from the current directory.
// found_path: buffer for the found directory
// Returns: 1 = found, 0 = not found
int find_git_root(char *found_path, int maxlen)
{
    char *cwd = get_current_path();
    if (!cwd)
        return 0;
    while (1)
    {
        char git_path[PATH_MAX_LEN];
        snprintf(git_path, PATH_MAX_LEN, "%s%s.git", cwd, PATH_SEPARATOR);
        if (is_directory(git_path))
        {
            strncpy(found_path, cwd, maxlen);
            free(cwd);
            return 1;
        }
        // Go up one directory (last separator)
        char *last_sep = strrchr(cwd, PATH_SEPARATOR[0]);
        if (!last_sep || last_sep == cwd)
            break;
        *last_sep = '\0';
    }
    free(cwd);
    return 0;
}

// Check if the line already exists
int line_exists(const char *filename, const char *line)
{
    FILE *file = fopen(filename, "r");
    if (!file)
    {
        return 0;
    }

    char buffer[PATH_MAX_LEN];

    while (fgets(buffer, sizeof(buffer), file))
    {
        // Newline entfernen
        buffer[strcspn(buffer, "\r\n")] = '\0';

        if (strcmp(buffer, line) == 0)
        {
            fclose(file);
            return 1;
        }
    }

    fclose(file);
    return 0;
}

// Main function
int ign_main(int argc, char *argv[])
{
    // Check for arguments
    if (argc < 2)
    {
        printf("Please run with at least one argument or -h.\n");
        return 1;
    }

    // Show help
    if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0)
    {
        return help();
    }

    // Get the Current Directory
    char *cwd = get_current_path();
    normalize_path(cwd);

    // Search for Git root (.git folder)
    char git_root[PATH_MAX_LEN] = {0};
    if (!find_git_root(git_root, PATH_MAX_LEN))
    {
        printf(
            "No .git folder found in the current or any parent directory.\n");
        return 1;
    }

    normalize_path(git_root);

    char relative[PATH_MAX_LEN] = {0};

    if (!make_relative(git_root, cwd, relative, sizeof(relative)))
    {
        printf("Failed to compute relative path.\n");
        free(cwd);
        return 1;
    }

    normalize_path(relative);

    // Determine .gitignore path in the Git root
    char gitignore_path[PATH_MAX_LEN];
    snprintf(gitignore_path, PATH_MAX_LEN, "%s%s.gitignore", git_root,
             PATH_SEPARATOR);

    // If .gitignore does not exist, create it
    if (!file_exists(gitignore_path))
    {
        FILE *file = fopen(gitignore_path, "w");
        if (!file)
        {
            perror("Error creating .gitignore file");
            return 1;
        }
        fclose(file);
        printf(".gitignore was created in directory: %s\n", git_root);
    }
    else
    {
        printf(".gitignore found in directory: %s\n", git_root);
    }

    // Append arguments (except --help) to .gitignore
    FILE *file = fopen(gitignore_path, "a");
    if (!file)
    {
        perror("Error opening .gitignore file for appending");
        return 1;
    }

    for (int i = 1; i < argc; i++)
    {
        if (strcmp(argv[i], "--help") == 0)
            continue;

        char entry[PATH_MAX_LEN];
        snprintf(entry, sizeof(entry), "%s/%s", relative, argv[i]);
        normalize_path(entry);

        const char *final_entry = strlen(relative) > 0 ? entry : argv[i];

        if (line_exists(gitignore_path, final_entry))
        {
            printf("%s already exists in .gitignore.\n", final_entry);
            continue;
        }

        fprintf(file, "%s\n", final_entry);
        printf("%s added to .gitignore.\n", final_entry);
    }

    fclose(file);
    return 0;
}
