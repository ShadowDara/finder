#include "gameLayer.hpp"

#include <string>

#include "raylib.h"
#include "imgui.h"

#include "macros.hpp"
#include "version.hpp"
#include "imguiTools.h"

#include "stringManipulation.h"
#include "utility.hpp"


Texture2D tex;


struct GameData
{
	// ADD YOUR GAME DATA HERE

	// Game Version
	// use parseVersion to parse the version string into a Version struct
	// this is useful for comparing versions later on when you want to
	// add new features or fix bugs
	// or loading older save files that are not compatible with the new version
	//
	// You can Compare versions like this:
	// 
	//Version a = parseVersion("1.2.0");
	//Version b = parseVersion("1.10.0");

	//if (a < b)
	//{
	//	// true
	//}
	Version version = parseVersion(GAME_VERSION);
};


// Function to initialize the game
void initGame()
{
	// INITIALIZE YOUR GAME DATA HERE

	tex = LoadTexture(RESOURCES_PATH "window_e.png");
}


// Function to update the game state
void updateGame(float deltaTime)
{
	// Begin drawing and end drawing are called externally in the main loop,
	// so we only need to clear the background here

	ClearBackground(RAYWHITE);

	DrawText("Congrats! You created your first window!", 190, 200, 20, LIGHTGRAY);

	DrawTexture(tex, 100, 100, WHITE);

#pragma region imgui
#if REMOVE_IMGUI == 0
	ImGui::PushStyleColor(ImGuiCol_WindowBg, {});
	ImGui::PushStyleColor(ImGuiCol_DockingEmptyBg, {});
	ImGui::DockSpaceOverViewport(ImGui::GetMainViewport());
	ImGui::PopStyleColor(2);


	ImGui::Begin("Test");

	ImGui::Text("Hello");
	ImGui::Button("Button");
	ImGui::Button("Button2");

	ImGui::End();
#endif
#pragma endregion

	// ADD YOUR GAME LOGIC HERE
}


// Function which runs after the game is closed
// use it to save your data, free memory, etc.
void closeGame()
{
	// FREE YOUR GAME DATA HERE

	UnloadTexture(tex);
}
