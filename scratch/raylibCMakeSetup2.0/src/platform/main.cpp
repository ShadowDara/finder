// Main Entry Point
// macros are defined in macros.hpp


#include "macros.hpp"

#include "raylib.h"
#include <iostream>


#if REMOVE_IMGUI == 0
	#include "imgui.h"
	#include "rlImGui.h"
	#include "imguiThemes.h"
#endif


#include "gameLayer.hpp"


int main(void)
{

	SetConfigFlags(FLAG_WINDOW_RESIZABLE);
	InitWindow(GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_NAME);

#pragma region imgui
#if REMOVE_IMGUI == 0
	rlImGuiSetup(true);

	//you can use whatever imgui theme you like!
	//ImGui::StyleColorsDark();
	//imguiThemes::yellow();
	//imguiThemes::gray();
	imguiThemes::green();
	//imguiThemes::red();
	//imguiThemes::embraceTheDarkness();


	ImGuiIO &io = ImGui::GetIO(); (void)io;
	io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;       // Enable Keyboard Controls
	io.ConfigFlags |= ImGuiConfigFlags_DockingEnable;           // Enable Docking
	io.FontGlobalScale = 2;

	ImGuiStyle &style = ImGui::GetStyle();
	if (io.ConfigFlags & ImGuiConfigFlags_ViewportsEnable)
	{
		//style.WindowRounding = 0.0f;
		style.Colors[ImGuiCol_WindowBg].w = 0.5f;
		//style.Colors[ImGuiCol_DockingEmptyBg].w = 0.f;
	}

	// Deactivate ini file
	ImGui::GetIO().IniFilename = nullptr;
#endif
#pragma endregion

	initGame();

	while (!WindowShouldClose())
	{
		BeginDrawing();

#pragma region imgui
#if REMOVE_IMGUI == 0
		rlImGuiBegin();
#endif
#pragma endregion

		updateGame(GetFrameTime());

#pragma region imgui
#if REMOVE_IMGUI == 0
		rlImGuiEnd();

		if (io.ConfigFlags & ImGuiConfigFlags_ViewportsEnable)
		{
			ImGui::UpdatePlatformWindows();
			ImGui::RenderPlatformWindowsDefault();
		}
#endif
#pragma endregion

		EndDrawing();
	}


#pragma region imgui
#if REMOVE_IMGUI == 0
	rlImGuiShutdown();
#endif
#pragma endregion

	CloseWindow();

	closeGame();

	//if you want the console to stay after closing the window
	//std::cin.clear();
	//std::cin.get();

	return 0;
}
