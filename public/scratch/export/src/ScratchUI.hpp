#pragma once

#include <raylib.h>

class ScratchUI
{
public:
    void update();
    void draw();

    bool running = false;
    bool startRequested = false;

private:
    Rectangle startButton{
        10.0f,
        10.0f,
        100.0f,
        30.0f};

    Rectangle stopButton{
        120.0f,
        10.0f,
        100.0f,
        30.0f};
};
