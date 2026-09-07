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

    if (ui.startRequested)
    {
        ui.startRequested = false;

        if (startCallback != nullptr)
            startCallback();
    }

    if (!ui.running)
        return;

    // Hier läuft später dein generiertes Scratch-Update.
}

void ScratchRuntime::setStartCallback(ScriptCallback callback)
{
    startCallback = callback;
}

void ScratchRuntime::setStopCallback(ScriptCallback callback)
{
    stopCallback = callback;
}

void ScratchRuntime::draw()
{
    for (auto &sprite : sprites)
    {
        sprite.draw();
    }

    ui.draw();
}

void ScratchRuntime::shutdown()
{
    for (auto &sprite : sprites)
    {
        sprite.unloadCostume();
    }
    CloseWindow();
}

bool ScratchRuntime::shouldClose() const
{
    return WindowShouldClose();
}

ScratchSprite &ScratchRuntime::sprite(size_t index)
{
    return sprites[index];
}
