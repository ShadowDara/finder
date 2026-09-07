// Verson Parser function in C++20 by Shadowdara MIT

#pragma once

#include "macros.hpp"

#include <string>
#include <sstream>
#include <vector>
#include <stdexcept>


struct Version
{
    int major = 0;
    int minor = 0;
    int patch = 0;

    // to compare the versions
    auto operator<=>(const Version&) const = default;
};


Version parseVersion(const std::string& versionStr);
