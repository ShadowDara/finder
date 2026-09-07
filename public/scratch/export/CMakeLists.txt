#https://github.com/meemknight/raylibCmakeSetup
#Version 2.0.0

cmake_minimum_required(VERSION 3.16...4.3)

set(CMAKE_CXX_STANDARD 17)

project(mygame)


#! ! ! ! ! ! !
#set this to ON instead of OFF to ship the game!
#basically this will change the RESOURCES_PATH to be the local path
#! ! ! ! ! ! !
set(PRODUCTION_BUILD OFF CACHE BOOL "Make this a production build" FORCE)
#delete the out folder after changing if visual studio doesn recognize the change!


# ON MSCV and for Desktop
if(MSVC)
	if (NOT EMSCRIPTEN)
		set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Release>:Release>")
		set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
		add_compile_options(/arch:AVX2) #make sure SIMD optimizations take place
	endif()
endif()


#may give problems on linux
if(PRODUCTION_BUILD)
	set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE) #link time optimization
else()
	set(CMAKE_INTERPROCEDURAL_OPTIMIZATION FALSE)
endif()


# Ensure RayLib is built as static libraries
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build Raylib as static libraries" FORCE)


set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(GLFW_INSTALL OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)


# to compile with emscripten
if (EMSCRIPTEN)
    set(PLATFORM Web CACHE STRING "" FORCE)
endif()


#add_subdirectory(thirdparty/glad)				#opengl loader
#add_subdirectory(thirdparty/stb_image)			#loading immaged
#add_subdirectory(thirdparty/stb_truetype)		#loading ttf files
#add_subdirectory(thirdparty/enet-1.3.17)		#networking
#add_subdirectory(thirdparty/glm)				#math
#add_subdirectory(thirdparty/imgui-docking)		#ui
#----------V-----------------------V------------#my libraries								

# Doesnt work yet in the web export				
#add_subdirectory(thirdparty/safeSave)			#saving data, designed for gamedev. It also makes backups so the player won't loose saves.
#add_subdirectory(thirdparty/profilerLib)		#profiling, just a simpe library for measuring elapsed time

#add_subdirectory(thirdparty/gl2d)				#2D rendering library
#add_subdirectory(thirdparty/glui)		


if (EMSCRIPTEN)
    set(PLATFORM Web CACHE STRING "" FORCE)
	
	# important linker flags
	set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -s USE_GLFW=3 -s ASSERTIONS=1 -s WASM=1 -s ASYNCIFY -s GL_ENABLE_GET_PROC_ADDRESS=1")
	
    set(CMAKE_EXECUTABLE_SUFFIX ".html")
endif()


#Add raylib, and here you would add other libraries if needed!
add_subdirectory(thirdparty/raylib-5.0)
add_subdirectory(thirdparty/imgui-docking)
add_subdirectory(thirdparty/rlImGui)


# MY_SOURCES is defined to be a list of all the source files for my game 
# DON'T ADD THE SOURCES BY HAND, they are already added with this macro
file(GLOB_RECURSE MY_SOURCES CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")


add_executable("${CMAKE_PROJECT_NAME}")

set_property(TARGET "${CMAKE_PROJECT_NAME}" PROPERTY CXX_STANDARD 20)



if(PRODUCTION_BUILD)
	# setup the ASSETS_PATH macro to be in the root folder of your exe
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC RESOURCES_PATH="./resources/") 

	# remove the option to debug asserts.
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC PRODUCTION_BUILD=1) 
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC DEVELOPLEMT_BUILD=0) 

else()
	# This is useful to get an ASSETS_PATH in your IDE during development
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC RESOURCES_PATH="${CMAKE_CURRENT_SOURCE_DIR}/resources/")
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC PRODUCTION_BUILD=0)
	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC DEVELOPLEMT_BUILD=1) 

endif()

target_sources("${CMAKE_PROJECT_NAME}" PRIVATE ${MY_SOURCES} )


if(MSVC) # If using the VS compiler...

	target_compile_definitions("${CMAKE_PROJECT_NAME}" PUBLIC _CRT_SECURE_NO_WARNINGS)
	
	if(PRODUCTION_BUILD)
		set_target_properties("${CMAKE_PROJECT_NAME}" PROPERTIES LINK_FLAGS "/SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup") #no console
	endif()

	#YOU CAN REMOVE THE CONSOLE WITH THIS LINE! YOU CAN EVEN DO AN IF PRODUCTION_BUILD TO REMOVE IT ONLY IN PRODUCTION BUILDS
	#set_target_properties("${CMAKE_PROJECT_NAME}" PROPERTIES LINK_FLAGS "/SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup") #no console

endif()

#force remove unicode
if (WIN32)
	target_compile_options("${CMAKE_PROJECT_NAME}" PRIVATE /UUNICODE /U_UNICODE)
endif()


target_include_directories("${CMAKE_PROJECT_NAME}" PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include/")


# linking in the web export
if (EMSCRIPTEN)
	# Link raylib not static in the web export
	target_link_libraries("${CMAKE_PROJECT_NAME}" PRIVATE 
		raylib
		imgui
		rlimgui
		#glm
		#stb_image
		#stb_truetype
		#profilerLib
		#glad
	)
	
	target_link_options(mygame PRIVATE
		"--shell-file=${CMAKE_SOURCE_DIR}/minishell.html"
	)
else()
	# for Desktop
	# Link raylib library statically, Here wou would add other libraries!
	target_link_libraries("${CMAKE_PROJECT_NAME}" PRIVATE 
		raylib_static
		imgui
		rlimgui
		#glm
		#glad
		#stb_image
		#stb_truetype
		#profilerLib

		#ADD enet version! also don't forget to uncomment enet from above
		# enet
	)
endif()
