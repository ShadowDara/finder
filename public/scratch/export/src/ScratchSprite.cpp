#include "ScratchSprite.hpp"

#include <cmath>

void ScratchSprite::moveSteps(float steps)
{
    const float radians = direction * DEG2RAD;

    x += std::cos(radians) * steps;
    y += std::sin(radians) * steps;
}

void ScratchSprite::turnRight(float degrees)
{
    direction += degrees;

    if (direction >= 360.0f)
        direction -= 360.0f;
}

void ScratchSprite::turnLeft(float degrees)
{
    direction -= degrees;

    if (direction < 0.0f)
        direction += 360.0f;
}

void ScratchSprite::loadCostume(
    const char *path,
    float rotationCenterX,
    float rotationCenterY)
{
    unloadCostume();
    costume = LoadTexture(path);
    this->rotationCenterX = rotationCenterX;
    this->rotationCenterY = rotationCenterY;
}

void ScratchSprite::unloadCostume()
{
    if (costume.id != 0)
    {
        UnloadTexture(costume);
        costume = {};
    }
}

void ScratchSprite::draw() const
{
    if (!visible || costume.id == 0)
        return;

    DrawTexturePro(
        costume,
        Rectangle{
            0,
            0,
            static_cast<float>(costume.width),
            static_cast<float>(costume.height)},
        Rectangle{
            x,
            y,
            static_cast<float>(costume.width),
            static_cast<float>(costume.height)},
        Vector2{
            rotationCenterX,
            rotationCenterY},
        -direction + 90.0f,
        WHITE);
}
