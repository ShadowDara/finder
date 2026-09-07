// Database for String and Integer KeyValue Map

#pragma once

#include <iostream>
#include <fstream>
#include <cstdint>
#include <string>
#include <unordered_map>
#include <thread>
#include <chrono>
#include <filesystem>


namespace KeyValueDBSInt
{
    // Read a Map
    std::unordered_map<std::string, int32_t> read_map(const std::string& filename);

    // Save a Map
    void write_map(const std::unordered_map<std::string, int32_t>& map, const std::string& filename);

    bool acquire_lock(const std::string& lockfile, int timeout_ms = 5000);

    void release_lock(const std::string& lockfile);
} // namespace KeyValueDBSInt
