#pragma once

// Includes

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
    #include <direct.h>
    #include <windows.h>
    #define PATH_SEPARATOR "\\"
#else
    #include <sys/stat.h>
    #include <unistd.h>
    #define PATH_SEPARATOR "/"
#endif

#define PATH_MAX_LEN 1024

// Function to get the current Path
char *get_current_path();

// Function to check if a directory is available
int is_directory(const char *path);

// Function to check if a Folder exists in the current Directory
int folder_exists_in_current(const char *folder_name);
