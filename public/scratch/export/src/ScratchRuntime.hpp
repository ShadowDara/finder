#pragma once

#include <coroutine>
#include <cstddef>
#include <functional>
#include <string>
#include <utility>
#include <unordered_map>
#include <vector>

#include "ScratchSprite.hpp"
#include "ScratchUI.hpp"

class ScriptTask
{
public:
    using Handle = std::coroutine_handle<>;

    struct promise_type
    {
        using PromiseHandle = std::coroutine_handle<promise_type>;
        ScriptTask get_return_object() { return ScriptTask{PromiseHandle::from_promise(*this)}; }
        std::suspend_always initial_suspend() const noexcept { return {}; }
        std::suspend_always final_suspend() const noexcept { return {}; }
        void return_void() const noexcept {}
        void unhandled_exception() const noexcept {}
    };

    explicit ScriptTask(Handle handle) : handle(handle) {}
    ScriptTask(const ScriptTask &) = delete;
    ScriptTask &operator=(const ScriptTask &) = delete;
    ScriptTask(ScriptTask &&other) noexcept : handle(other.handle) { other.handle = {}; }
    ~ScriptTask()
    {
        if (handle)
            handle.destroy();
    }

    Handle release()
    {
        Handle released = handle;
        handle = {};
        return released;
    }

private:
    Handle handle;
};

class ScratchRuntime
{
public:
    using ScriptCallback = ScriptTask (*)();
    using EventCallback = void (*)();

    // Sprites
    std::vector<ScratchSprite> sprites;
    ScratchSprite background;
    std::vector<ScratchSprite> backdrops;
    size_t currentBackdrop = 0;
    std::unordered_map<std::string, double> variables;
    std::unordered_map<std::string, Sound> sounds;

    ScratchUI ui;

    void init(
        int width,
        int height,
        const char *title,
        int FPS);

    void loadAssets();
    void setStartCallback(ScriptCallback callback);
    void addStartCallback(ScriptCallback callback);
    void setStopCallback(EventCallback callback);
    void setSpriteClickCallback(size_t index, ScriptCallback callback);
    struct WaitUntilAwaiter
    {
        ScratchRuntime *runtime;
        std::function<bool()> condition;
        bool await_ready() const { return condition(); }
        void await_suspend(std::coroutine_handle<> handle);
        void await_resume() const noexcept {}
    };

    struct WaitSecondsAwaiter
    {
        ScratchRuntime *runtime;
        double seconds;
        bool await_ready() const { return seconds <= 0.0; }
        void await_suspend(std::coroutine_handle<> handle);
        void await_resume() const noexcept {}
    };

    WaitUntilAwaiter waitUntil(std::function<bool()> condition);
    WaitSecondsAwaiter waitSeconds(double seconds);
    void setBackdrop(size_t index);
    void nextBackdrop();
    void update();
    void draw();
    void shutdown();

    bool shouldClose() const;

    ScratchSprite &sprite(size_t index);
    double &variable(const char *name);
    double unsupportedValue(const char *opcode);
    void loadSound(const char *name, const char *path);
    void playSound(const char *name);

private:
    struct TaskState
    {
        std::coroutine_handle<> handle;
        std::function<bool()> condition;
        double resumeAt = -1.0;
    };

    void launch(ScriptTask task);
    void suspendUntil(std::coroutine_handle<> handle, std::function<bool()> condition);
    void suspendFor(std::coroutine_handle<> handle, double seconds);
    void updateTasks();
    void cancelTasks();

    ScriptCallback startCallback = nullptr;
    std::vector<ScriptCallback> startCallbacks;
    std::vector<TaskState> tasks;
    EventCallback stopCallback = nullptr;
    std::vector<ScriptCallback> spriteClickCallbacks;
};
