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
                launch(spriteClickCallbacks[index]());
        }
    }

    if (ui.startRequested)
    {
        ui.startRequested = false;

        ui.running = false;
        cancelTasks();
        ui.running = true;

        for (auto callback : startCallbacks)
        {
            if (callback != nullptr)
                launch(callback());
        }

        if (startCallbacks.empty() && startCallback != nullptr)
            launch(startCallback());
    }

    if (!ui.running)
    {
        cancelTasks();
        return;
    }

    updateTasks();
}

void ScratchRuntime::setStartCallback(ScriptCallback callback)
{
    startCallback = callback;
}

void ScratchRuntime::addStartCallback(ScriptCallback callback)
{
    startCallbacks.push_back(callback);
}

void ScratchRuntime::setStopCallback(EventCallback callback)
{
    stopCallback = callback;
}

void ScratchRuntime::setSpriteClickCallback(size_t index, ScriptCallback callback)
{
    if (spriteClickCallbacks.size() <= index)
        spriteClickCallbacks.resize(index + 1, nullptr);
    spriteClickCallbacks[index] = callback;
}

ScratchRuntime::WaitUntilAwaiter ScratchRuntime::waitUntil(std::function<bool()> condition)
{
    return WaitUntilAwaiter{this, std::move(condition)};
}

ScratchRuntime::WaitSecondsAwaiter ScratchRuntime::waitSeconds(double seconds)
{
    return WaitSecondsAwaiter{this, seconds};
}

void ScratchRuntime::WaitUntilAwaiter::await_suspend(std::coroutine_handle<> handle)
{
    runtime->suspendUntil(handle, std::move(condition));
}

void ScratchRuntime::WaitSecondsAwaiter::await_suspend(std::coroutine_handle<> handle)
{
    runtime->suspendFor(handle, seconds);
}

void ScratchRuntime::launch(ScriptTask task)
{
    auto handle = task.release();
    if (handle && !handle.done())
    {
        tasks.push_back(TaskState{handle});
        handle.resume();
    }
    else if (handle)
        handle.destroy();
}

void ScratchRuntime::suspendUntil(std::coroutine_handle<> handle, std::function<bool()> condition)
{
    for (auto &task : tasks)
    {
        if (task.handle == handle)
        {
            task.condition = std::move(condition);
            task.resumeAt = -1.0;
            return;
        }
    }
}

void ScratchRuntime::suspendFor(std::coroutine_handle<> handle, double seconds)
{
    for (auto &task : tasks)
    {
        if (task.handle == handle)
        {
            task.condition = {};
            task.resumeAt = GetTime() + seconds;
            return;
        }
    }
}

void ScratchRuntime::updateTasks()
{
    for (size_t index = 0; index < tasks.size();)
    {
        auto &task = tasks[index];
        bool ready = !task.condition && task.resumeAt < 0.0;
        if (task.condition)
            ready = task.condition();
        else if (task.resumeAt >= 0.0)
            ready = GetTime() >= task.resumeAt;

        if (ready)
            task.handle.resume();

        if (task.handle.done())
        {
            task.handle.destroy();
            tasks.erase(tasks.begin() + static_cast<std::ptrdiff_t>(index));
        }
        else
        {
            ++index;
        }
    }
}

void ScratchRuntime::cancelTasks()
{
    for (auto &task : tasks)
        task.handle.destroy();
    tasks.clear();
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
    ui.running = false;
    cancelTasks();

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
    if (!IsAudioDeviceReady())
    {
        logWarning("Audio device is not ready");
        return;
    }

    if (!FileExists(path))
    {
        logWarning(std::string("Sound file does not exist: ") + path);
        return;
    }

    Sound sound = LoadSound(path);
    if (sound.frameCount == 0)
    {
        logWarning(std::string("Could not load sound: ") + path);
        return;
    }

    sounds[name] = sound;
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
