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

    const float screenX = GetScreenWidth() * 0.5f + x;
    const float screenY = GetScreenHeight() * 0.5f - y;

    DrawTexturePro(
        costume,
        Rectangle{
            0,
            0,
            static_cast<float>(costume.width),
            static_cast<float>(costume.height)},
        Rectangle{
            screenX,
            screenY,
            static_cast<float>(costume.width),
            static_cast<float>(costume.height)},
        Vector2{
            rotationCenterX,
            rotationCenterY},
        -direction + 90.0f,
        WHITE);

    if (sayUntil > GetTime())
    {
        DrawRectangle(static_cast<int>(screenX) - 10, static_cast<int>(screenY) - 60, 180, 28, WHITE);
        DrawRectangleLines(static_cast<int>(screenX) - 10, static_cast<int>(screenY) - 60, 180, 28, BLACK);
        DrawText(sayMessage.c_str(), static_cast<int>(screenX), static_cast<int>(screenY) - 54, 16, BLACK);
    }
}

void ScratchSprite::drawAsBackground() const
{
    if (!visible || costume.id == 0)
        return;

    DrawTexturePro(
        costume,
        Rectangle{0, 0, static_cast<float>(costume.width), static_cast<float>(costume.height)},
        Rectangle{0, 0, static_cast<float>(GetScreenWidth()), static_cast<float>(GetScreenHeight())},
        Vector2{0, 0},
        0.0f,
        WHITE);
}

void ScratchSprite::sayForSeconds(const char *message, double seconds)
{
    sayMessage = message;
    sayUntil = GetTime() + seconds;
}

bool ScratchSprite::containsPoint(Vector2 point) const
{
    if (!visible || costume.id == 0)
        return false;

    const float screenX = GetScreenWidth() * 0.5f + x - rotationCenterX;
    const float screenY = GetScreenHeight() * 0.5f - y - rotationCenterY;
    return CheckCollisionPointRec(point, Rectangle{screenX, screenY, static_cast<float>(costume.width), static_cast<float>(costume.height)});
}
