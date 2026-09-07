#pragma once

#include "ScratchSprite.hpp"

class ScratchRuntime
{
public:
    ScratchSprite sprite;

    void init(
        int width,
        int height,
        const char *title);

    void update();
    void draw();
    void shutdown();

    bool shouldClose() const;
};
