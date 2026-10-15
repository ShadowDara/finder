// Multiline KeyValue Parser
//
//  Important needs kvp.hpp to work

#pragma once


#include <string>
#include <unordered_map>

#include <kvp/kvp2.hpp>


namespace KeyValueParserML {

	// Map for the Data
	// std::unordered_map<std::string, std::string> 

	using MAP = KeyValueParser2::KeyValueStore<std::unordered_map<std::string, std::string>;

	MAP parse(const std::string &input)
	{}

	std::string save(const MAP &map)
	{
		std::string output = "# This file was auto generated, all comments will be removed after the next saving\n\n";
		
		for (const auto &[key, value] : map)
		{
			output += e.key;
			output += "[[";
			output += e.value;
			output += "]]\n";
		}

		return output;
	}

	std::string saveInPlace(const std::string &input)
	{}
} // namespace KeyValueParserML

