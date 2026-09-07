// Verson Parser function in C++20 by Shadowdara MIT

#include "version.hpp"

Version parseVersion(const std::string& versionStr)
{
    Version version;
    std::stringstream ss(versionStr);
    std::string part;
    std::vector<int> numbers;

    while (std::getline(ss, part, '.'))
    {
        numbers.push_back(std::stoi(part));
    }

    if (numbers.size() != 3)
        throw std::invalid_argument("Invalid version format. Expected MAJOR.MINOR.PATCH");

    version.major = numbers[0];
    version.minor = numbers[1];
    version.patch = numbers[2];

    return version;
}
