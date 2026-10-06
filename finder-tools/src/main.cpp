#include <iostream>

#include <string>
#include <vector>
#include <sstream>

#include <yaml-cpp/yaml.h>

#include "argparser.h"
#include "curl.hpp"
#include "ignconf_json.hpp"
#include "doctor.hpp"
#include "finder.hpp"

#include "../version.hpp"
#include "../json.hpp"

using namespace nlohmann;

struct Package
{
	std::string pkgname;
	std::string owner;
};

Package parsePackage(std::string input)
{
    bool first = true;
    std::stringstream ss(input);
    std::string item;
    Package p;

    while (std::getline(ss, item, '/')) {
        if (first)
        {
            p.owner = item;
            first = false;
        }
        else
        {
            p.pkgname = item;
            return p;
        }
    }

    return p;
}

std::vector<Package> parseConf()
{
    std::vector<Package> result;

    try
    {
        YAML::Node config = YAML::LoadFile(".cpp-registry.yaml");

        for (const auto& package : config["packages"])
        {
            result.push_back(
                parsePackage(package.as<std::string>())
            );
        }
    }
    catch (const YAML::Exception&)
    {
        return {};
    }

    return result;
}

int main(int argc, char **argv)
{
    auto conf = parseConf();

    ArgCommand* root = arg_command_new(NAME, "", "", false, NULL, 0);

    // Config Command
    ArgCommand* configCMD = arg_command_new("config", "", "", false, NULL, 0);

    
        // SubCommands for config
        //
        ArgCommand* createconfCMD = arg_command_new("create", "command to create a new config", "", false, NULL, 0);
        ArgCommand* viewconfCMD = arg_command_new("view", "view config values", "", false, NULL, 0);

        // Register
        arg_command_add_subcommand(configCMD, createconfCMD);
        arg_command_add_subcommand(configCMD, viewconfCMD);
    

    // Linki Command
    ArgCommand* linkicmd = arg_command_new("linki", "", "", false, NULL, 0);

    // Search Command
    const char* name_aliases[] = { "n" };
    ArgCommand* search = arg_command_new("search", "search for librarys.", "", false, NULL, 0);
    arg_command_string(search, "name", "", "File name or pattern to search for.", true, name_aliases, 1);
    
    // Version Command
    const char* aliases[] = { "v", "-v", "--v", "--version" };
    ArgCommand* version = arg_command_new("version", "Displays the version", "", false, aliases, 4);

    // Doctor Command
    const char* doctor_aliases[] = { "d", "-d", "--d", "--doctor" };
    ArgCommand* doctorcmd = arg_command_new("doctor", "Displays the configuration", "", false, doctor_aliases, 4);

    // Run Command
    //const char* run_aliases[] = { };
    ArgCommand* runcmd = arg_command_new("run", "run a binary from the project", "", false, /* run_aliases */ NULL, 0);

    // Build Command
    //const char* build_aliases[] = { };
    ArgCommand* buildcmd = arg_command_new("build", "build the project", "", false, /* build_aliases */ NULL, 0);

    arg_command_add_subcommand(root, configCMD);
    arg_command_add_subcommand(root, search);
    arg_command_add_subcommand(root, version);
    arg_command_add_subcommand(root, doctorcmd);
    arg_command_add_subcommand(root, runcmd);
    arg_command_add_subcommand(root, buildcmd);
    arg_command_add_subcommand(root, linki);

    // Parsed command
    ArgCommand* cmd = arg_command_parse(root, argc - 1, argv + 1);

    // CONFIG COMMAND
    if (cmd == configCMD)
    {
        auto confpath = getConfigPath();
        std::ifstream file(confpath);

        if (!file)
        {
            std::cerr << "Could not open file!\n";
            return 1;
        }

        std::cout << file.rdbuf();

        return 0;
    }

    // Create Config Command
    else if (cmd == createconfCMD)
    {
        auto confpath = getConfigPathC();
        std::ofstream file(confpath);

        if (!file)
        {
            std::cerr << "Could not create file!\n";
            return 1;
        }

        file << "{}";

        file.close();

        std::cout << "Config created at " << confpath << "\n";

        return 0;
    }

    // Linki CMD
    else if (cmd == linkicmd)
    {
        std::cout << "Linki\n";
    }

    // Search Command

    // Search packages in the registry
    else if (cmd == search)
    {
        const char* name = arg_command_get_string(cmd, "name");
        
        if (name == nullptr || name[0] == '\0')
        {
            return 1;
        }

        auto data = curlGet(REGISTRY);

        if (data.empty())
        {
            return 1;
        }

        json j = json::parse(data);

        if (!j.contains(name)) {
            std::cout << "Package not found: " << name << '\n';
            return 1;
        }
        json package = j[name];

        if (package.is_null() || package.empty())
        {
            std::cout << "Package not found: " << name << '\n';
            return 1;
        }
        
        std::cout << "Package: " << name << '\n';
        
        for (const auto& [key, value] : package.items())
        {
            std::cout << key << ": ";
            
            if (value.is_string()) std::cout << value.get<std::string>();
            else std::cout << value.dump(); std::cout << '\n';
        }
    }

    // get the current version
    else if (cmd == version)
    {
        std::cout << VERSION "\n";
    }

    // like flutter doctor
    else if (cmd == doctorcmd)
    {
        doctor();
    }

    // default
    else
    {
	// help check
        if (arg_command_get_bool(root, "help"))
	{
	    arg_command_print_help(root); return 0;
	}

	// default message
        std::cout << NAME " - package viewer for the cpp registry: https://cpp-registry.github.io\n";
        if (conf.size() > 0)
        {
            std::cout << "\nPackages:\n";
            for (const auto& e : conf)
            {
                std::cout << e.owner << "/" << e.pkgname << "\n";
            }
        }
    }
    
    arg_command_free(root);

    return 0;
}
