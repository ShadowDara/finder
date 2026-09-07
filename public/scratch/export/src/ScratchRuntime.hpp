#pragma once

#include <functional>
#include <string>
#include <unordered_map>
#include <vector>

#include "ScratchSprite.hpp"
#include "ScratchUI.hpp"

class ScratchRuntime
{
public:
    using ScriptCallback = void (*)();

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
    void setStopCallback(ScriptCallback callback);
    void setSpriteClickCallback(size_t index, ScriptCallback callback);
    bool waitUntil(const std::function<bool()> &condition);
    bool waitSeconds(double seconds);
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
    ScriptCallback startCallback = nullptr;
    ScriptCallback stopCallback = nullptr;
    std::vector<ScriptCallback> spriteClickCallbacks;
};
