// by Shadowdara
// https://shadowdara.github.io/wp

#pragma once

#include <string>
#include <vector>
#include <sstream>


// Parser for a simple 2D map format
// feel free to expand it to your needs


struct Map2D {
	int width;
	int height;
	std::vector<int> data;
};


Map2D importMap(std::string input);


std::string exportMap(Map2D map);
