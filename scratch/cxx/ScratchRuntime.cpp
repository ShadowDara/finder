#include "ScratchRuntime.hpp"

#include <raylib.h>

void ScratchRuntime::init(
    int width,
    int height,
    const char *title)
{
    InitWindow(
        width,
        height,
        title);

    SetTargetFPS(60);
}

void ScratchRuntime::update()
{
}

void ScratchRuntime::draw()
{
    sprite.draw();
}

void ScratchRuntime::shutdown()
{
    if (sprite.costume.id != 0)
    {
        UnloadTexture(sprite.costume);
        sprite.costume = {};
    }

    CloseWindow();
}

bool ScratchRuntime::shouldClose() const
{
    return WindowShouldClose();
}
