#pragma once

#include <string>

#include <raylib.h>

class ScratchSprite
{
public:
    float x = 0.0f;
    float y = 0.0f;
    float direction = 90.0f;
    bool visible = true;
    std::string sayMessage;
    double sayUntil = 0.0;

    Texture2D costume{};
    float rotationCenterX = 0.0f;
    float rotationCenterY = 0.0f;

    void moveSteps(float steps);
    void turnRight(float degrees);
    void turnLeft(float degrees);

    void loadCostume(
        const char *path,
        float rotationCenterX,
        float rotationCenterY);
    void unloadCostume();

    void draw() const;
    void drawAsBackground() const;
    void sayForSeconds(const char *message, double seconds);
    bool containsPoint(Vector2 point) const;
};
