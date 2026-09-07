#pragma once

#include "ScratchSprite.hpp"
#include "ScratchUI.hpp"

class ScratchRuntime
{
public:
    using ScriptCallback = void (*)();

    ScratchSprite sprite;
    ScratchUI ui;

    void init(
        int width,
        int height,
        const char *title,
        int FPS);

    void loadAssets();
    void setStartCallback(ScriptCallback callback);
    void update();
    void draw();
    void shutdown();

    bool shouldClose() const;

private:
    ScriptCallback startCallback = nullptr;
};
