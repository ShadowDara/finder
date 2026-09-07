#pragma once

#include <raylib.h>

class ScratchSprite
{
public:
    float x = 0.0f;
    float y = 0.0f;
    float direction = 90.0f;

    Texture2D costume{};

    void moveSteps(float steps);
    void turnRight(float degrees);
    void turnLeft(float degrees);

    void draw() const;
};
