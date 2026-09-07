interface ScratchProject {
    targets: any[],
    monitors: any[],
    extensions: any[],
    meta: any
}

let engine_h = `
#pragma once
#include <string>

void init();
void loop();
void cleanup();

// Rendering
void loadBackdrop(const std::string& name, const std::string& path);
void switchBackdrop(const std::string& name);
void nextBackdrop();

// Sprites
struct Sprite {
    std::string name;
    int x, y, w, h;
    bool visible;
};

void createSprite(const std::string& name, int x, int y, int w, int h);
bool isSpriteClicked(const std::string& name);

// Sound
void playSound(const std::string& name);

// Scheduler
void runScheduler();

`;

let engine_cpp = `
#include "engine.h"
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <map>
#include <vector>
#include <iostream>

SDL_Window* window = nullptr;
SDL_Renderer* renderer = nullptr;

// -------- Backdrops --------
std::vector<SDL_Texture*> backdrops;
std::vector<std::string> backdropNames;
int currentBackdrop = 0;

// -------- Sprites --------
std::map<std::string, Sprite> sprites;

// -------- Input --------
int mouseX = 0, mouseY = 0;
bool mouseClicked = false;

// -------- Init --------
void init() {
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);
    IMG_Init(IMG_INIT_PNG);

    window = SDL_CreateWindow("Scratch Clone",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        960, 720, 0);

    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
}

// -------- Backdrops --------
void loadBackdrop(const std::string& name, const std::string& path) {
    SDL_Surface* surf = IMG_Load(path.c_str());
    SDL_Texture* tex = SDL_CreateTextureFromSurface(renderer, surf);
    SDL_FreeSurface(surf);

    backdrops.push_back(tex);
    backdropNames.push_back(name);
}

void switchBackdrop(const std::string& name) {
    for (int i = 0; i < backdropNames.size(); i++) {
        if (backdropNames[i] == name) {
            currentBackdrop = i;
            return;
        }
    }
}

void nextBackdrop() {
    currentBackdrop = (currentBackdrop + 1) % backdrops.size();
}

// -------- Sprites --------
void createSprite(const std::string& name, int x, int y, int w, int h) {
    sprites[name] = {name, x, y, w, h, true};
}

bool isSpriteClicked(const std::string& name) {
    if (!mouseClicked) return false;

    auto& s = sprites[name];

    return (mouseX >= s.x && mouseX <= s.x + s.w &&
            mouseY >= s.y && mouseY <= s.y + s.h);
}

// -------- Sound (stub) --------
void playSound(const std::string& name) {
    std::cout << "Play sound: " << name << std::endl;
}

// -------- Scheduler extern --------
extern void runScheduler();

// -------- Main Loop --------
void loop() {
    bool running = true;
    SDL_Event e;

    while (running) {

        mouseClicked = false;

        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                running = false;

            if (e.type == SDL_MOUSEBUTTONDOWN) {
                mouseClicked = true;
                SDL_GetMouseState(&mouseX, &mouseY);
            }
        }

        // --- LOGIK ---
        runScheduler();

        // --- RENDER ---
        SDL_RenderClear(renderer);

        // Backdrop
        if (!backdrops.empty()) {
            SDL_RenderCopy(renderer, backdrops[currentBackdrop], NULL, NULL);
        }

        // Sprites (simple rectangles for now)
        for (auto& [name, s] : sprites) {
            if (!s.visible) continue;

            SDL_Rect r = {s.x, s.y, s.w, s.h};
            SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
            SDL_RenderFillRect(renderer, &r);
        }

        SDL_RenderPresent(renderer);
    }
}

void cleanup() {
    SDL_Quit();
}

`;

let main_cpp = `
// main.cpp
#include "engine.h"

void onFlagClicked(); // aus generated.cpp

int main() {
    init();

    onFlagClicked(); // dein generierter Code läuft hier

    loop();
    cleanup();
}
`;

function parseScratch(json: string) {
    const data: ScratchProject = JSON.parse(json);


}
