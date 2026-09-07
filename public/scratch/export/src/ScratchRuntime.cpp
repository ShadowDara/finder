#include "ScratchRuntime.hpp"

#include <raylib.h>

void ScratchRuntime::init(
    int width,
    int height,
    const char *title,
    int FPS)
{
    InitWindow(
        width,
        height,
        title);

    SetTargetFPS(FPS);
}

void ScratchRuntime::update()
{
    ui.update();

    if (!ui.running)
        return;

    // Hier läuft später dein generiertes Scratch-Update.
}

void ScratchRuntime::draw()
{
    sprite.draw();

    ui.draw();
}

void ScratchRuntime::shutdown()
{
    sprite.unloadCostume();
    CloseWindow();
}

bool ScratchRuntime::shouldClose() const
{
    return WindowShouldClose();
}
