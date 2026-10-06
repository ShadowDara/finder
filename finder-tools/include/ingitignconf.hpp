#pragma once

// embedded configuration for ingitign

#define CPPM_GITIGNORE_CONFIG_START "###### CPPM-CONFIG-SECTION-START"
#define CPPM_GITIGNORE_CONFIG_END "###### CPPM-CONFIG-SECTION-END"

#include <unordered_map>
#include <fstream>
#include <string>

inline void initConfig()
{
    std::ifstream filein(".gitignore");

    // Check lines
    std::string line;

    bool startfound = false;
    bool endfound = false;

    while (std::getline(filein, line))
    {
        if (line.find(CPPM_GITIGNORE_CONFIG_START) != std::string::npos)
        {
            startfound = true;
        }

        if (line.find(CPPM_GITIGNORE_CONFIG_END) != std::string::npos)
        {
            endfound = true;
            break;
        }
    }

    std::ofstream file(".gitignore", std::ios::app);

    if (!file)
    {
        std::cerr << "Could not open .gitignore file";
        return;
    }

    if (startfound && !endfound)
    {
        std::cout << "End section of the Config could not be found! please delete the line\n"
            CPPM_GITIGNORE_CONFIG_START;
        return;
    }

    if (startfound && endfound)
    {
        return;
    }

    file << "\n" CPPM_GITIGNORE_CONFIG_START "\n" CPPM_GITIGNORE_CONFIG_END "\n";

    file.close();
}

inline std::unordered_map<std::string, std::string> readConfig()
{
    std::unordered_map<std::string, std::string> config;

    std::ifstream filein(".gitignore");

    if (!filein)
    {
        std::cerr << "Could not open .gitignore file\n";
        return config;
    }

    constexpr std::string_view prefix = "#% ";

    std::string line;
    bool inside = false;

    while (std::getline(filein, line))
    {
        if (line.find(CPPM_GITIGNORE_CONFIG_START) != std::string::npos)
        {
            inside = true;
            continue;
        }

        if (line.find(CPPM_GITIGNORE_CONFIG_END) != std::string::npos)
        {
            break;
        }

        // Außerhalb des Config-Blocks ignorieren
        if (!inside)
            continue;

        // Keine Config-Zeile -> Kommentar/ignorieren
        if (line.compare(0, prefix.size(), prefix) != 0)
            continue;

        // "#% " entfernen
        std::string data = line.substr(prefix.size());

        // '=' suchen
        const std::size_t pos = data.find('=');

        if (pos == std::string::npos)
            continue;

        std::string key = data.substr(0, pos);
        std::string value = data.substr(pos + 1);

        config[key] = value;
    }

    return config;
}

inline void writeConfig(
    const std::unordered_map<std::string, std::string>& config)
{
    std::ifstream filein(".gitignore");

    if (!filein)
    {
        std::cerr << "Could not open .gitignore file\n";
        return;
    }

    std::vector<std::string> lines;

    std::string line;
    bool inside = false;

    while (std::getline(filein, line))
    {
        if (line.find(CPPM_GITIGNORE_CONFIG_START) != std::string::npos)
        {
            inside = true;

            lines.push_back(line);

            for (const auto& [key, value] : config)
            {
                lines.push_back("#% " + key + "=" + value);
            }

            continue;
        }

        if (line.find(CPPM_GITIGNORE_CONFIG_END) != std::string::npos)
        {
            inside = false;
            lines.push_back(line);
            continue;
        }

        // Alles innerhalb des Blocks wird ersetzt
        if (inside)
            continue;

        lines.push_back(line);
    }

    filein.close();

    std::ofstream fileout(".gitignore", std::ios::trunc);

    if (!fileout)
    {
        std::cerr << "Could not open .gitignore file\n";
        return;
    }

    for (const auto& line : lines)
    {
        fileout << line << '\n';
    }
}
