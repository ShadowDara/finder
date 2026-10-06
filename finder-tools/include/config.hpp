#pragma once

#include <string>

#define CMAKE_SETTINGS_FILE "CMakeSettings.json"

struct CMake_Settings
{
	std::string name;
	std::string generator;
	std::string configurationType;
	std::string inheritEnvironments;
	std::string buildRoot;
	std::string installRoot;
	std::string cmakeCommandArgs;
	std::string cmakeToolchain;
	std::string cmakeExecutable;
};

constexpr const char* COMPILE_COMMANDS_FILE[] = {
	"compile_commands.json",
	"build/compile_commands.json",
	"out/build/x64-Debug/compile_commands.json",
	"out/build/x64-Release/compile_commands.json",
};

struct Compile_Commands
{
	std::string directory;
	std::string command;
	std::string file;
	std::string output;
};
