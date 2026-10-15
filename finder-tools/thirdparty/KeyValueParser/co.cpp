#include <iostream>
#include <fstream>
#include <cstdint>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int32_t> test = {
        {"Apfel", 5},
        {"Banane", 10},
        {"Kirsche", 7}
    };

    write_map(test, "map.bin");

    auto loaded = read_map("map.bin");
    for (auto& [k, v] : loaded)
        std::cout << k << " -> " << v << "\n";
}
