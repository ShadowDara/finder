#include "ScratchRuntime.hpp"
#include "Logger.hpp"

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

    InitAudioDevice();

    SetTargetFPS(FPS);
}

void ScratchRuntime::update()
{
    ui.update();

    if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT))
    {
        Vector2 mouse = GetMousePosition();
        for (size_t index = 0; index < sprites.size(); ++index)
        {
            if (index < spriteClickCallbacks.size() && sprites[index].containsPoint(mouse) && spriteClickCallbacks[index] != nullptr)
                spriteClickCallbacks[index]();
        }
    }

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

void ScratchRuntime::setSpriteClickCallback(size_t index, ScriptCallback callback)
{
    if (spriteClickCallbacks.size() <= index)
        spriteClickCallbacks.resize(index + 1, nullptr);
    spriteClickCallbacks[index] = callback;
}

bool ScratchRuntime::waitUntil(const std::function<bool()> &condition)
{
    while (!condition() && !WindowShouldClose())
    {
        ui.update();
        if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT))
        {
            Vector2 mouse = GetMousePosition();
            for (size_t index = 0; index < sprites.size(); ++index)
            {
                if (index < spriteClickCallbacks.size() && sprites[index].containsPoint(mouse) && spriteClickCallbacks[index] != nullptr)
                    spriteClickCallbacks[index]();
            }
        }

        BeginDrawing();
        ClearBackground(RAYWHITE);
        draw();
        EndDrawing();
        PollInputEvents();
    }

    return !WindowShouldClose();
}

bool ScratchRuntime::waitSeconds(double seconds)
{
    const double endTime = GetTime() + seconds;
    while (GetTime() < endTime && !WindowShouldClose())
    {
        ui.update();

        BeginDrawing();
        ClearBackground(RAYWHITE);
        draw();
        EndDrawing();
        PollInputEvents();
    }

    return !WindowShouldClose();
}

void ScratchRuntime::draw()
{
    if (!backdrops.empty())
        backdrops[currentBackdrop].drawAsBackground();
    else
        background.drawAsBackground();

    for (auto &sprite : sprites)
    {
        sprite.draw();
    }

    ui.draw();

    auto score = variables.find("score");
    if (score != variables.end())
    {
        const int boxWidth = 150;
        const int boxX = GetScreenWidth() - boxWidth - 12;
        DrawRectangle(boxX, 8, boxWidth, 34, WHITE);
        DrawRectangleLines(boxX, 8, boxWidth, 34, DARKGRAY);
        DrawText("score", boxX + 8, 12, 16, DARKGRAY);
        DrawText(TextFormat("%g", score->second), boxX + 82, 12, 16, BLACK);
    }
}

void ScratchRuntime::shutdown()
{
    background.unloadCostume();

    for (auto &backdrop : backdrops)
        backdrop.unloadCostume();

    for (auto &sprite : sprites)
    {
        sprite.unloadCostume();
    }

    for (auto &sound : sounds)
        UnloadSound(sound.second);

    CloseAudioDevice();

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

double &ScratchRuntime::variable(const char *name)
{
    return variables[name];
}

double ScratchRuntime::unsupportedValue(const char *opcode)
{
    logWarning(std::string("Unsupported Scratch value: ") + opcode);
    return 0.0;
}

void ScratchRuntime::loadSound(const char *name, const char *path)
{
    sounds[name] = LoadSound(path);
}

void ScratchRuntime::playSound(const char *name)
{
    auto sound = sounds.find(name);
    if (sound == sounds.end())
    {
        logWarning(std::string("Sound not loaded: ") + name);
        return;
    }

    PlaySound(sound->second);
}

void ScratchRuntime::setBackdrop(size_t index)
{
    if (index < backdrops.size())
        currentBackdrop = index;
}

void ScratchRuntime::nextBackdrop()
{
    if (!backdrops.empty())
        currentBackdrop = (currentBackdrop + 1) % backdrops.size();
}
