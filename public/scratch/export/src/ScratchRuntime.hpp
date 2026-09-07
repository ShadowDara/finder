#pragma once

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
    std::unordered_map<std::string, double> variables;

    ScratchUI ui;

    void init(
        int width,
        int height,
        const char *title,
        int FPS);

    void loadAssets();
    void setStartCallback(ScriptCallback callback);
    void setStopCallback(ScriptCallback callback);
    void update();
    void draw();
    void shutdown();

    bool shouldClose() const;

    ScratchSprite &sprite(size_t index);
    double &variable(const char *name);
    double unsupportedValue(const char *opcode);

private:
    ScriptCallback startCallback = nullptr;
    ScriptCallback stopCallback = nullptr;
};
