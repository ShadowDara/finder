// CMO
// Cross-platform message database
// Windows + Linux

#include "_dir_main.h"

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
    #include <windows.h>
#else
    #include <time.h>
#endif

#define FILENAME "projectmessages.txt"

#include "../info.h"

// Get current Unix timestamp in milliseconds
int64_t get_time_ms(void)
{
#ifdef _WIN32

    FILETIME ft;
    GetSystemTimeAsFileTime(&ft);

    // Windows FILETIME:
    // 100-nanosecond intervals since 1601-01-01
    //
    // Unix timestamp:
    // seconds since 1970-01-01

    uint64_t time = ((uint64_t)ft.dwHighDateTime << 32) | ft.dwLowDateTime;

    // Difference between 1601 and 1970 in 100-ns intervals
    time -= 116444736000000000ULL;

    // Convert 100-ns intervals to milliseconds
    return (int64_t)(time / 10000);

#else

    struct timespec ts;

    if (clock_gettime(CLOCK_REALTIME, &ts) != 0)
    {
        return -1;
    }

    return (int64_t)ts.tv_sec * 1000 + ts.tv_nsec / 1000000;

#endif
}

int cmo_main(void)
{
    printf("CMO - Version" BUILD_MESSAGE "\n");

    // Get timestamp
    int64_t ms = get_time_ms();

    if (ms < 0)
    {
        printf("Could not get current time.\n");
        return 1;
    }

    // Get message
    char line[8196];

    printf("Enter your message: ");

    if (fgets(line, sizeof(line), stdin) == NULL)
    {
        printf("Could not read input.\n");
        return 1;
    }

    // Open database file
    FILE *f = fopen(FILENAME, "a");

    if (f == NULL)
    {
        perror("Could not open file");
        return 1;
    }

    // Save timestamp + message
    fprintf(f, "%lld %s", (long long)ms, line);

    fclose(f);

    printf("Message saved!\n");

    return 0;
}
