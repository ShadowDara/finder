#pragma once

#include <string>
#include <filesystem>
#include <cstdlib>
#include <stdexcept>

inline std::filesystem::path getHomeDirectory()
{
    namespace fs = std::filesystem;

#ifdef _WIN32
    if (const char* home = std::getenv("USERPROFILE"))
        return fs::path(home);

    if (const char* drive = std::getenv("HOMEDRIVE")) {
        if (const char* path = std::getenv("HOMEPATH"))
            return fs::path(std::string(drive) + path);
    }
#else
    if (const char* home = std::getenv("HOME"))
        return std::filesystem::path(home);
#endif

    throw std::runtime_error("Home directory could not be determined");
}

inline std::filesystem::path getConfigPath()
{
    return getHomeDirectory() / ".finder" / "config.json5";
}

// Creates the config path folder too
inline std::filesystem::path getConfigPathC()
{
    namespace fs = std::filesystem;

    auto config = getConfigPath();

    if (!fs::exists(config))
    {
        fs::create_directories(config.parent_path());
    }

    return config;
}

