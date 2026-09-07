# KVP
#
# this is a simple little KeyValue Parser Library
# by Shadowdara
#
# licensed under MIT 2026 Shadowdara
#

cmake_minimum_required(VERSION 3.13)
project(kvp)

add_library(kvp)
target_include_directories(kvp PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include/")
target_sources(kvp PRIVATE
	"${CMAKE_CURRENT_SOURCE_DIR}/src/kvp.cpp"
)
set_property(TARGET kvp PROPERTY CXX_STANDARD 20)
