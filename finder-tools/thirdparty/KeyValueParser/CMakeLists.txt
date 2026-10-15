# CMakeList.txt: CMake-Projekt für "KeyValueParser". Schließen Sie die Quelle ein, und definieren Sie
# projektspezifische Logik hier.
#
cmake_minimum_required (VERSION 3.10)

# Aktivieren Sie Hot Reload für MSVC-Compiler, sofern unterstützt.
if (POLICY CMP0141)
  cmake_policy(SET CMP0141 NEW)
  set(CMAKE_MSVC_DEBUG_INFORMATION_FORMAT "$<IF:$<AND:$<C_COMPILER_ID:MSVC>,$<CXX_COMPILER_ID:MSVC>>,$<$<CONFIG:Debug,RelWithDebInfo>:EditAndContinue>,$<$<CONFIG:Debug,RelWithDebInfo>:ProgramDatabase>>")
endif()

# Options for MSVC to use UTF-8 encoding for source files
if (MSVC)
  add_compile_options(/utf-8)		# add UTF-8
  add_compile_options(/arch:AVX2)	# make sure SIMD optimizations take place
  add_compile_options(/Gy)   # function-level linking
  add_link_options(/OPT:REF) # remove unused functions
endif()

# Link Time Optimization (LTO) aktivieren für Release-Builds
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE TRUE)


project ("KeyValueParser")


# Add the KVP Lib
add_subdirectory(kvp)
# Add the KVPDB Lib
add_subdirectory(kvpdb)


# Fügen Sie der ausführbaren Datei dieses Projekts eine Quelle hinzu.
add_executable (KeyValueParser "KeyValueParser.cpp")

# Link the Libary
target_link_libraries(KeyValueParser kvp kvpdb)

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET KeyValueParser PROPERTY CXX_STANDARD 20)
endif()

# TODO: Fügen Sie bei Bedarf Tests hinzu, und installieren Sie Ziele.


project("DBParser")

# Fügen Sie der ausführbaren Datei dieses Projekts eine Quelle hinzu.
add_executable(DBParser "DBParser.cpp")

# Link the Libary
target_link_libraries(DBParser kvp kvpdb)

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET DBParser PROPERTY CXX_STANDARD 20)
endif()
