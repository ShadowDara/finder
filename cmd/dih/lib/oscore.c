#include "oscore.h"

// Cross-platform Funktion: aktuelles Verzeichnis
char *get_current_path()
{
    char *buffer = malloc(PATH_MAX_LEN);
    if (!buffer)
        return NULL;

#ifdef _WIN32
    if (_getcwd(buffer, PATH_MAX_LEN) == NULL)
    {
        free(buffer);
        return NULL;
    }
#else
    if (getcwd(buffer, PATH_MAX_LEN) == NULL)
    {
        free(buffer);
        return NULL;
    }
#endif

    return buffer;
}

// Cross-platform prüfen, ob ein Pfad ein Directory ist
int is_directory(const char *path)
{
#ifdef _WIN32
    DWORD attrib = GetFileAttributesA(path);
    if (attrib == INVALID_FILE_ATTRIBUTES)
        return 0;
    return (attrib & FILE_ATTRIBUTE_DIRECTORY) != 0;
#else
    struct stat path_stat;
    if (stat(path, &path_stat) != 0)
        return 0;
    return S_ISDIR(path_stat.st_mode);
#endif
}

// Prüfen, ob ein Unterordner im aktuellen Verzeichnis existiert
int folder_exists_in_current(const char *folder_name)
{
    char *cwd = get_current_path();
    if (!cwd)
        return 0;

    char full_path[PATH_MAX_LEN];
    snprintf(full_path, PATH_MAX_LEN, "%s%s%s", cwd, PATH_SEPARATOR,
             folder_name);
    free(cwd);

    return is_directory(full_path);
}
