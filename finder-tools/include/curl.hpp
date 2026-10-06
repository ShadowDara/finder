#pragma once

#include <cstdio>
#include <string>

#ifdef _WIN32
    #define _popen _popen
    #define _pclose _pclose
#else
    #define _popen popen
    #define _pclose pclose
#endif

inline std::string curlGet(const std::string& url)
{
    std::string result;

    std::string command = "curl -s \"" + url + "\"";

    FILE* pipe = _popen(command.c_str(), "r");

    if (!pipe)
        return {};

    char buffer[4096];

    while (fgets(buffer, sizeof(buffer), pipe))
        result += buffer;

    _pclose(pipe);

    return result;
}
