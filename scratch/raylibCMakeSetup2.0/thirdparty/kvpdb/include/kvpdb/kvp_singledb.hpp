#pragma once

#include <iostream>
#include <fstream>
#include <cstring>
#include <cstdint>


namespace KVPSDB {

constexpr uint64_t version = 1;

// Beispielstruktur für die Werte
struct default_db_struct
{
    char tempname[8] = "default";

    default_db_struct() = default;
    default_db_struct(const std::string& name)
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

// Einzelnes Struct speichern
template <typename DBStruct = default_db_struct>
class SingleValueDB
{
private:
    DBStruct value;                 // nur ein Struct
    bool hasValue = false;          // um zu wissen, ob ein Wert gesetzt wurde
    char databasename[12];          // Name der DB

public:
    SingleValueDB(const std::string& name = "dbname")
    {
        std::strncpy(databasename, name.c_str(), sizeof(databasename) - 1);
        databasename[sizeof(databasename) - 1] = '\0';
    }

    // Setzen / Aktualisieren
    void put(const DBStruct& newValue)
    {
        value = newValue;
        hasValue = true;
    }

    // Lesen
    bool get(DBStruct& outValue) const
    {
        if (hasValue)
        {
            outValue = value;
            return true;
        }
        return false;
    }

    // Löschen
    void remove()
    {
        hasValue = false;
    }

    // Speichern als Binary
    void save(const std::string& filename) const
    {
        std::ofstream file(filename, std::ios::binary);
        if (!file)
            throw std::runtime_error("Error opening file for write");

        // Magic + Version + DB Name
        const char magic[4] = {'S','V','D','B'};
        file.write(magic, 4);
        if (!file)
            throw std::runtime_error("Failed to write value");
        file.write(reinterpret_cast<const char*>(&version), sizeof(version));
        if (!file)
            throw std::runtime_error("Failed to write value");
        file.write(databasename, sizeof(databasename));
        if (!file)
            throw std::runtime_error("Failed to write value");

        // Flag ob Wert vorhanden
        file.write(reinterpret_cast<const char*>(&hasValue), sizeof(hasValue));
        if (!file)
            throw std::runtime_error("Failed to write value");

        // Wert speichern
        if (hasValue)
            file.write(reinterpret_cast<const char*>(&value), sizeof(DBStruct));
            if (!file)
                throw std::runtime_error("Failed to write value");

        file.close();
    }

    // Laden aus Binary
    void load(const std::string& filename)
    {
        std::ifstream file(filename, std::ios::binary);
        if (!file)
            throw std::runtime_error("Error opening file for read");

        char magic[4];
        file.read(magic, 4);
        if (std::memcmp(magic, "SVDB", 4) != 0) // SVD + B
            throw std::runtime_error("Invalid file format");

        uint64_t fileVersion;
        file.read(reinterpret_cast<char*>(&fileVersion), sizeof(fileVersion));
        if (fileVersion != version)
            throw std::runtime_error("Unsupported DB version");

        char dbname[12];
        file.read(dbname, sizeof(dbname));
        if (std::memcmp(dbname, databasename, 12) != 0)
            throw std::runtime_error("DB name mismatch");

        file.read(reinterpret_cast<char*>(&hasValue), sizeof(hasValue));

        if (hasValue)
        {
            file.read(reinterpret_cast<char*>(&value), sizeof(DBStruct));
        }

        file.close();
    }

    // Prüfen, ob Wert gesetzt
    bool contains() const
    {
        return hasValue;
    }

    // Für Debug / Test
    void print() const
    {
        if (hasValue)
            std::cout << value << "\n";
        else
            std::cout << "<empty>\n";
    }

    // Daten löschen
    void clear()
    {
        hasValue = false;
    }
};

}
