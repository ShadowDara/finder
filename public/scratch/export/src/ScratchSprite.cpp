#include "ScratchSprite.hpp"

#include <algorithm>
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

    constexpr float stageWidth = 480.0f;
    constexpr float stageHeight = 360.0f;
    const float scale = std::min(
        GetScreenWidth() / stageWidth,
        GetScreenHeight() / stageHeight);
    const float stageLeft = (GetScreenWidth() - stageWidth * scale) * 0.5f;
    const float stageTop = (GetScreenHeight() - stageHeight * scale) * 0.5f;
    const float screenX = stageLeft + (stageWidth * 0.5f + x) * scale;
    const float screenY = stageTop + (stageHeight * 0.5f - y) * scale;

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
            static_cast<float>(costume.width) * scale,
            static_cast<float>(costume.height) * scale},
        Vector2{
            rotationCenterX * scale,
            rotationCenterY * scale},
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

    constexpr float stageWidth = 480.0f;
    constexpr float stageHeight = 360.0f;
    const float scale = std::min(
        GetScreenWidth() / stageWidth,
        GetScreenHeight() / stageHeight);
    const float stageLeft = (GetScreenWidth() - stageWidth * scale) * 0.5f;
    const float stageTop = (GetScreenHeight() - stageHeight * scale) * 0.5f;

    DrawTexturePro(
        costume,
        Rectangle{0, 0, static_cast<float>(costume.width), static_cast<float>(costume.height)},
        Rectangle{stageLeft, stageTop, stageWidth * scale, stageHeight * scale},
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

    constexpr float stageWidth = 480.0f;
    constexpr float stageHeight = 360.0f;
    const float scale = std::min(
        GetScreenWidth() / stageWidth,
        GetScreenHeight() / stageHeight);
    const float stageLeft = (GetScreenWidth() - stageWidth * scale) * 0.5f;
    const float stageTop = (GetScreenHeight() - stageHeight * scale) * 0.5f;
    const float screenX = stageLeft + (stageWidth * 0.5f + x) * scale - rotationCenterX * scale;
    const float screenY = stageTop + (stageHeight * 0.5f - y) * scale - rotationCenterY * scale;
    return CheckCollisionPointRec(point, Rectangle{screenX, screenY, static_cast<float>(costume.width) * scale, static_cast<float>(costume.height) * scale});
}
