cmake_minimum_required(VERSION 3.25)
project(finder VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(finder main.cpp)

# Compiler-specific flags
target_compile_options(finder PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)

# Copy templates directory next to the binary at build time
add_custom_command(TARGET finder POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_SOURCE_DIR}/templates
        $<TARGET_FILE_DIR:finder>/templates
    COMMENT "Copying templates..."
    VERBATIM
)

install(TARGETS finder RUNTIME DESTINATION bin)
install(DIRECTORY templates/ DESTINATION bin/templates)
