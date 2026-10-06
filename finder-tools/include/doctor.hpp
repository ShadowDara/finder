#pragma once

// same like flutter doctor

#include "colors.hpp"
#include "ingitignconf.hpp"
#include "config.hpp"
#include "../generated_version.hpp"

#include <unordered_map>
#include <cstdlib>
#include <filesystem>
#include <string>
#include <iostream>
#include <filesystem>
#include <cstdio>


inline bool is_in_path(const std::string& program)
{
    const char* path_env = std::getenv("PATH");

    if (!path_env)
        return false;

#ifdef _WIN32
    constexpr char separator = ';';
#else
    constexpr char separator = ':';
#endif

    std::string path(path_env);
    std::size_t start = 0;

    while (start <= path.size())
    {
        std::size_t end = path.find(separator, start);

        std::string dir = path.substr(
            start,
            end == std::string::npos ? std::string::npos : end - start
        );

        if (!dir.empty())
        {
            std::filesystem::path candidate =
                std::filesystem::path(dir) / program;

#ifdef _WIN32
            // Windows sucht auch .exe, .cmd, .bat usw.
            if (std::filesystem::exists(candidate))
                return true;

            if (std::filesystem::exists(candidate.string() + ".exe"))
                return true;

            if (std::filesystem::exists(candidate.string() + ".cmd"))
                return true;

            if (std::filesystem::exists(candidate.string() + ".bat"))
                return true;
#else
            if (std::filesystem::exists(candidate) &&
                !std::filesystem::is_directory(candidate))
            {
                return true;
            }
#endif
        }

        if (end == std::string::npos)
            break;

        start = end + 1;
    }

    return false;
}

inline std::string exec(const std::string& command)
{
#ifdef _WIN32
    FILE* pipe = _popen((command + " 2>&1").c_str(), "r");
#else
    FILE* pipe = popen(command.c_str(), "r");
#endif

    if (!pipe)
        return "";

    std::string result;
    char buffer[4096];

    while (fgets(buffer, sizeof(buffer), pipe))
        result += buffer;

#ifdef _WIN32
    int status = _pclose(pipe);
#else
    int status = pclose(pipe);
#endif

    if (status != 0)
        return "";

    return result;
}

inline void doctor_print(std::string msg, bool success, int& suc)
{
    if (success)
    {
        std::cout << ANSI_GREEN "[OK]" ANSI_END " " << msg;
    }
    else
    {
        std::cout << ANSI_RED "[FAIL]"  ANSI_END " " << msg;
        suc++;
    }
}

inline void doctor_print_bin(std::string binary, int &no_success_count, std::string cmd = "--version")
{
	bool inpath = is_in_path(binary);
    if (inpath)
    {
		std::string version = exec(binary + " " + cmd);
		doctor_print(binary + " is installed and in PATH! Version:\n" + version, true, no_success_count);
    }
    else
    {
		doctor_print(binary + " was not found in PATH!", false, no_success_count);
	}
}

inline bool exists(std::string path)
{
    return std::filesystem::is_regular_file(path);
}

#define s no_success_count

inline void doctor()
{
	int no_success_count = 0;

	std::cout << "Running cppm doctor...\n";

	doctor_print("cppm" BUILD_MESSAGE "\n", true, s);

    // CMAKE
    doctor_print_bin("cmake", s);

    // GIT
    doctor_print_bin("git", s);

    // CL EXE MSVC COMPILER
#if WIN32
    // CL
    doctor_print_bin("cl", s, "");
#endif

    doctor_print_bin("gcc", s);

    doctor_print_bin("g++", s);

    doctor_print_bin("clang", s);

    doctor_print_bin("clang++", s);

    // CMAKE_SETTINGS_FILE
    if (exists(CMAKE_SETTINGS_FILE))
    {
        doctor_print("CMakeSettings.json exists!\n", true, s);
    }
    else
    {
        doctor_print("CMakeSettings.json does not exist!\n", false, s);
    }

    // CMAKE_SETTINGS_FILE
    if (exists("Makefile"))
    {
        doctor_print("Makefile exists!\n", true, s);
    }
    else
    {
        doctor_print("Makefile does not exist!\n", false, s);
    }

#ifdef _WIN32
    // later
#else
    if (exists("build/compile_commands.json"))
    {
        doctor_print("compile_commands.json exists!\n", true, s);
    }
    else
    {
        doctor_print("compile_commands.json does not exist!\n", false, s);
    }
#endif

    std::cout << "\nDoctor finished with " << s << " errors!\n";
}
