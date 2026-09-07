#include "Logger.hpp"

void log(std::string input)
{
    std::cout << input << "\n";
}

void logWarning(std::string input)
{
    std::cout << ANSI_YELLOW "[WARN] " << input << "\033[0m\n";
}
