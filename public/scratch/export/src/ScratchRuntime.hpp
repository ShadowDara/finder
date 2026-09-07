#pragma once

#include "ScratchSprite.hpp"
#include "ScratchUI.hpp"

class ScratchRuntime
{
public:
    ScratchSprite sprite;
    ScratchUI ui;

    void init(
        int width,
        int height,
        const char *title,
        int FPS);

    void loadAssets();
    void update();
    void draw();
    void shutdown();

    bool shouldClose() const;
};
