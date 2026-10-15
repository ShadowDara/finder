# KVPDB
#
# this is a simple little KeyValue Database Library
# by Shadowdara
#
# licensed under MIT 2026 Shadowdara
#

cmake_minimum_required(VERSION 3.13)
project(kvpdb)

add_library(kvpdb)
target_include_directories(kvpdb PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include/")
target_sources(kvpdb PRIVATE
	"${CMAKE_CURRENT_SOURCE_DIR}/src/kvp_int_db.cpp"
)
set_property(TARGET kvpdb PROPERTY CXX_STANDARD 20)
