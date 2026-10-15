// KeyValue Database

#pragma once

#include <iostream>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <vector>
#include <type_traits>
#include <algorithm> // für std::remove
#include <cstring>   // für std::strncpy
#include <cstdint>


namespace KVPDB {

constexpr uint64_t MAX_KEY_SIZE = 1024;
constexpr uint64_t version = 1;


// Beispielstruktur für die Werte
struct default_db_struct
{
    char tempname[8] = "default";

    default_db_struct() = default;
    default_db_struct(const std::string& name) : tempname()
    {
        std::strncpy(tempname, name.c_str(), sizeof(tempname) - 1);
        tempname[sizeof(tempname) - 1] = '\0';
    }

    friend std::ostream& operator<<(std::ostream& os, const default_db_struct& obj)
    {
        os << obj.tempname;
        return os;
    }
};


// Einfaches Key-Value Store mit Binary-Speicherung
template <typename DBStruct = default_db_struct>
class KeyValueDB
{
private:
    // store struct of the Database
    std::unordered_map<std::string, DBStruct> store;

    // Optional: einfacher sekundärer Index (z.B. nach erstem Buchstaben)
    std::unordered_map<char, std::vector<std::string>> index;

    // name for the Database
    char databasename[12];

public:
    // Konstruktor
    KeyValueDB(const std::string& name = "dbname")
    {
        std::strncpy(databasename, name.c_str(), sizeof(databasename) - 1);
        databasename[sizeof(databasename)-1] = '\0';
    }


    // Insert / Update
    void put(const std::string& key, const DBStruct& value)
    {
        bool isNewKey = (store.find(key) == store.end());
        store[key] = value;

        if (isNewKey)
        {
            index[key.empty() ? '\0' : key[0]].push_back(key);
        }
    }


    // Read
    bool get(const std::string& key, DBStruct& value) const
    {
        auto it = store.find(key);
        if (it != store.end())
        {
            value = it->second;
            return true;
        }
        return false;
    }


    // Delete
    void remove(const std::string& key)
    {
        auto it = store.find(key);
        if (it != store.end())
        {
            // Entferne aus Index
            char c = key.empty() ? '\0' : key[0];
            auto& vec = index[c];
            vec.erase(std::remove(vec.begin(), vec.end(), key), vec.end());
            if (vec.empty())
            {
                index.erase(c);
            }

            // Entferne aus Store
            store.erase(it);
        }
    }


    // Save to file as Binary
    void save(const std::string& filename) const
    {
        std::string temp = filename + ".tmp";
        std::ofstream file(temp, std::ios::binary);
        if (!file)
        {
            throw std::runtime_error("Error opening the File to write");
        }

        // for the identificating of the DB
        const char magic[4] = {'K','V','D','B'};
        file.write(magic, 4);

        // Save the Version
        file.write(reinterpret_cast<const char*>(&version), sizeof(version));

        // Save the Database Name
        file.write(reinterpret_cast<const char*>(&this->databasename), sizeof(this->databasename));

        // Save number of entries
        uint64_t count = store.size();
        file.write(reinterpret_cast<const char*>(&count), sizeof(count));

        // Save Entries
        for (const auto& [key, value] : store)
        {
            uint64_t keySize = key.size();
            file.write(reinterpret_cast<const char*>(&keySize), sizeof(keySize));
            file.write(key.data(), keySize);

            // Value als Binary speichern
            static_assert(std::is_trivially_copyable<DBStruct>::value,
                "DBStruct must be trivially copyable!");
            file.write(reinterpret_cast<const char*>(&value), sizeof(DBStruct));
        }

        file.flush();
        if (!file)
        {
            throw std::runtime_error("Write failed");
        }

        file.close();
        std::rename(temp.c_str(), filename.c_str());
    }


    // Load from file as Binary
    void load(const std::string& filename)
    {
        std::ifstream file(filename, std::ios::binary);
        if (!file)
        {
            throw std::runtime_error("Error opening the File to read");
        }

        clear();

        // to identify the DB
        char magic[4];
        if (!file.read(magic, 4))
        {
            throw std::runtime_error("Read error (magic)");
        }

        if (std::memcmp(magic, "KVDB", 4) != 0)
        {
            throw std::runtime_error("Invalid file format");
        }

        // Read the Version
        uint64_t fileVersion;
        if (!file.read(reinterpret_cast<char*>(&fileVersion), sizeof(fileVersion)))
        {
            throw std::runtime_error("Read error (version)");
        }

        // Check the Version
        if (fileVersion != version)
        {
            throw std::runtime_error("Unsupported DB version");
        }

        // Check the DB Name
        char dbname[12];
        if (!file.read(reinterpret_cast<char*>(&dbname), sizeof(dbname)))
        {
            throw std::runtime_error("Read error (dbname)");
        }

        // Check the DB Name
        if (std::memcmp(dbname, this->databasename, 12) != 0)
        {
            throw std::runtime_error("Invalid the DB Name");
        }

        // Load number of entries
        uint64_t count;
        // Check for Errors
        if (!file.read(reinterpret_cast<char*>(&count), sizeof(count)))
        {
            throw std::runtime_error("Read error (count)");
        }

        // Load Entries
        for (uint64_t i = 0; i < count; ++i)
        {
            uint64_t keySize;
            if (!file.read(reinterpret_cast<char*>(&keySize), sizeof(keySize)))
            {
                throw std::runtime_error("Read error (keySize)");
            }

            // Check the Keysize here
            if (keySize > MAX_KEY_SIZE)
            {
                throw std::runtime_error("Key too large");
            }

            std::string key(keySize, '\0');
            if (!file.read(&key[0], keySize))
            {
                throw std::runtime_error("Read error (key data)");
            }

            DBStruct value;
            if (!file.read(reinterpret_cast<char*>(&value), sizeof(DBStruct)))
            {
                throw std::runtime_error("Read error (value)");
            }

            store[key] = value;
        }

        // make a new Index
        rebuildIndex();
    }


    // Get keys by first character (for testing)
    std::vector<std::string> getByFirstChar(char c) const
    {
        auto it = index.find(c);
        if (it != index.end())
        {
            return it->second;
        }
        return {};
    }


    // Print all key-value pairs (for testing)
    void printAll() const   
    {
        for (const auto& pair : store)
        {
            std::cout << pair.first << " => " << pair.second << "\n";
        }
    }


    // Function to rebuild the Index after loading a File
    void rebuildIndex()
    {
        index.clear();
        for (const auto& [key, _] : store)
        {
            index[key.empty() ? '\0' : key[0]].push_back(key);
        }
    }


    // to check if a value is in the database
    bool contains(const std::string& key) const
    {
        return store.find(key) != store.end();
    }


    // Function to clear the Database
    void clear()
    {
        store.clear();
        index.clear();
    }
};

}
