// by Shadowdara
// https://shadowdara.github.io/wp

#include "utility.hpp"


Map2D importMap(std::string input)
{
	Map2D map;
	std::istringstream iss(input);
	iss >> map.width >> map.height;
	map.data.resize(map.width * map.height);
	for (int y = 0; y < map.height; ++y) {
		for (int x = 0; x < map.width; ++x) {
			iss >> map.data[y * map.width + x];
		}
	}
	return map;
}


std::string exportMap(Map2D map)
{
	std::string output;
	output += std::to_string(map.width) + " " + std::to_string(map.height) + "\n";
	for (int y = 0; y < map.height; ++y) {
		for (int x = 0; x < map.width; ++x) {
			output += std::to_string(map.data[y * map.width + x]) + " ";
		}
		output += "\n";
	}
	return output;
}
