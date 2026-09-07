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

void ScratchSprite::draw() const
{
    if (costume.id == 0)
        return;

    DrawTexture(
        costume,
        static_cast<int>(x),
        static_cast<int>(y),
        WHITE);
}
