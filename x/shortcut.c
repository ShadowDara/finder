#include <stdio.h>
#include <string.h>
#include "map.c"

#ifdef _WIN32
#include <windows.h>
#elif defined(__linux__)
#include <unistd.h>
#include <sys/wait.h>
#elif defined(__APPLE__)
#include <mach-o/dyld.h>
#include <unistd.h>
#include <sys/wait.h>
#endif

#ifdef _WIN32

// run command on windows
int run_command(const char *program, const char *const argv[])
{
    char command_line[4096] = {0};

    snprintf(command_line, sizeof(command_line),
             "cmd.exe /c %s",
             program);

    for (int i = 1; argv[i] != NULL; i++)
    {
        strncat(command_line, " ", sizeof(command_line) - strlen(command_line) - 1);
        strncat(command_line, argv[i], sizeof(command_line) - strlen(command_line) - 1);
    }

    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};

    si.cb = sizeof(si);

    BOOL success = CreateProcessA(
        NULL,
        command_line,
        NULL,
        NULL,
        TRUE,
        0,
        NULL,
        NULL,
        &si,
        &pi);

    if (!success)
    {
        fprintf(stderr, "CreateProcess failed: %lu\n", GetLastError());
        return -1;
    }

    WaitForSingleObject(pi.hProcess, INFINITE);

    DWORD exit_code = 0;

    if (!GetExitCodeProcess(pi.hProcess, &exit_code))
    {
        fprintf(stderr, "GetExitCodeProcess failed: %lu\n", GetLastError());
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return -1;
    }

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return (int)exit_code;
}

#else

// run command lin / mac
int run_command(const char *program, const char *const argv[])
{
    pid_t pid = fork();

    if (pid < 0)
    {
        return -1;
    }

    if (pid == 0)
    {
        execvp(program, argv);
        _exit(127);
    }

    int status;

    if (waitpid(pid, &status, 0) < 0)
    {
        return -1;
    }

    if (WIFEXITED(status))
    {
        return WEXITSTATUS(status);
    }

    return -1;
}

#endif

// get the path to the executable which is run
int get_executable_path(char *buffer, size_t size)
{
#ifdef _WIN32
    DWORD len = GetModuleFileNameA(NULL, buffer, (DWORD)size);

    if (len == 0 || len >= size)
        return 0;

    buffer[len] = '\0';
    return 1;

#elif defined(__linux__)
    ssize_t len = readlink("/proc/self/exe", buffer, size - 1);

    if (len < 0 || (size_t)len >= size)
        return 0;

    buffer[len] = '\0';
    return 1;

#elif defined(__APPLE__)
    uint32_t len = (uint32_t)size;

    if (_NSGetExecutablePath(buffer, &len) != 0)
        return 0;

    return 1;

#else
    return 0;
#endif
}

// get the name from the executable
const char *get_executable_name(void)
{
    static char path[4096];

    if (!get_executable_path(path, sizeof(path)))
        return NULL;

    char *name1 = strrchr(path, '/');
    char *name2 = strrchr(path, '\\');

    char *name = name1;

    if (name2 && (!name1 || name2 > name1))
        name = name2;

    return name ? name + 1 : path;
}

void parse_line(char *line)
{
    char *equals = strchr(line, '=');

    if (!equals)
        return;

    *equals = '\0';

    char *key = line;
    char *value = equals + 1;

    printf("Key: '%s', Value: '%s'\n", key, value);
}

int main(int argc, const char *const argv[])
{
    FILE *file = fopen("config.txt", "r");

    if (!file)
    {
        perror("fopen");
        return 1;
    }

    char line[256];

    Map map = {0};

    while (fgets(line, sizeof(line), file))
    {
        line[strcspn(line, "\r\n")] = '\0';

        char *equals = strchr(line, '=');

        if (!equals)
            continue;

        *equals = '\0';

        char *key = line;
        char *value = equals + 1;

        map_put(&map, key, value);
    }

    fclose(file);

    const char *name = get_executable_name();

#ifndef NDEBUG
    printf("%s\n", name);
#endif

    const char *value = map_get(&map, name);

#ifndef NDEBUG
    if (value)
    {
        printf("Name: %s\n", value);
    }
#endif

    int return_val = run_command(value, argv);

    return return_val;
}
