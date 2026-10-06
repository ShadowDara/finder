#pragma once

#include <fstream>
#include <iostream>
#include <string>
#include <string_view>
#include <unordered_map>

#include "../json.hpp"

#define CPPM_GITIGNORE_CONFIG_JSON "###### CPPM-CONFIG-JSON "

inline constexpr std::string_view cppmConfigPrefix =
CPPM_GITIGNORE_CONFIG_JSON;


// Erstellt die Config-Zeile, falls sie noch nicht existiert.
inline void initConfig_json()
{
    std::ifstream filein(".gitignore");

    bool found = false;

    if (filein)
    {
        std::string line;

        while (std::getline(filein, line))
        {
            if (line.starts_with(cppmConfigPrefix))
            {
                found = true;
                break;
            }
        }
    }

    if (found)
        return;

    std::ofstream file(".gitignore", std::ios::app);

    if (!file)
    {
        std::cerr << "Could not open .gitignore file\n";
        return;
    }

    file << "\n"
        << CPPM_GITIGNORE_CONFIG_JSON
        << "{}\n";
}


// Liest den JSON-String aus der Config-Zeile.
inline std::unordered_map<std::string, std::string> readConfig_json()
{
    std::unordered_map<std::string, std::string> config;

    std::ifstream filein(".gitignore");

    if (!filein)
    {
        std::cerr << "Could not open .gitignore file\n";
        return config;
    }

    std::string line;

    while (std::getline(filein, line))
    {
        if (!line.starts_with(cppmConfigPrefix))
            continue;

        // Prefix entfernen
        std::string jsonString =
            line.substr(cppmConfigPrefix.size());

        try
        {
            nlohmann::json json = nlohmann::json::parse(jsonString);

            if (!json.is_object())
            {
                std::cerr << "CPPM config must be a JSON object\n";
                return config;
            }

            for (const auto& [key, value] : json.items())
            {
                if (value.is_string())
                    config[key] = value.get<std::string>();
                else
                    config[key] = value.dump();
            }
        }
        catch (const nlohmann::json::parse_error& e)
        {
            std::cerr << "Invalid CPPM config JSON: "
                << e.what() << '\n';
        }

        break;
    }

    return config;
}


// Schreibt die Config als EINEN JSON-String hinter den Kommentar.
inline void writeConfig_json(
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
    bool configWritten = false;

    while (std::getline(filein, line))
    {
        // Existierende Config-Zeile ersetzen
        if (line.starts_with(cppmConfigPrefix))
        {
            nlohmann::json json = nlohmann::json::object();

            for (const auto& [key, value] : config)
                json[key] = value;

            lines.push_back(
                std::string(CPPM_GITIGNORE_CONFIG_JSON) +
                json.dump());

            configWritten = true;
            continue;
        }

        lines.push_back(line);
    }

    filein.close();

    // Falls noch keine Config existiert, am Ende hinzufügen.
    if (!configWritten)
    {
        nlohmann::json json = nlohmann::json::object();

        for (const auto& [key, value] : config)
            json[key] = value;

        lines.push_back("");
        lines.push_back(
            std::string(CPPM_GITIGNORE_CONFIG_JSON) +
            json.dump());
    }

    std::ofstream fileout(".gitignore", std::ios::trunc);

    if (!fileout)
    {
        std::cerr << "Could not open .gitignore file\n";
        return;
    }

    for (const auto& currentLine : lines)
        fileout << currentLine << '\n';
}
