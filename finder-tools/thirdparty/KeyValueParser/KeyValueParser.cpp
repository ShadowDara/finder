// KeyValueParser.cpp: Definiert den Einstiegspunkt für die Anwendung.
//

#include <kvp/kvp.hpp>

#include <fstream>
#include <iostream>
#include <chrono>
#include <string>
#include <unordered_map>

//#include "kvp_single_header.hpp"

using namespace std;

void makeBenchmakr(int count)
{
    // Simuliere große Eingabe
    std::string input;
    for (int i = 0; i < count; ++i) {
        input += "key" + std::to_string(i) + " = value" + std::to_string(i) + "\n";
    }

    auto start = std::chrono::high_resolution_clock::now();

    auto result = KeyValueParser::parse_kvp2(input);

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> elapsed = end - start;

    std::cout << "Parsed " << result.size() << " entries in "
        << elapsed.count() << " seconds. Input Size: " << input.size() << "\n";
}


int main(int argc, char* argv[])
{
	cout << "KeyValueParser." << "\n";

    std::ifstream file{ "../../../config.txt" };
    if (!file) {
        std::cerr << "Datei konnte nicht geöffnet werden\n";
        return 1;
    }

    std::string content(
        (std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>()
    );

	//auto result = KeyValueParser::parse_kvp(content);
    auto result1 = KeyValueParser::parse_kvp2(content);

    for (const auto& pair : result1) {
        std::cout << pair.first << " -> " << pair.second << "\n";
    }

#pragma region Benchmarking

    std::cout << "\nRunning the Benchmark\n\n";

    makeBenchmakr(1);
    makeBenchmakr(10);
    makeBenchmakr(100);
    makeBenchmakr(1000);
    makeBenchmakr(10000);
    makeBenchmakr(100000);
    makeBenchmakr(1000000);
    makeBenchmakr(10000000);

#pragma endregion

	return 0;
}
