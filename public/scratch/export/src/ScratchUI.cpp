#include "ScratchUI.hpp"

void ScratchUI::update()
{
    if (!IsMouseButtonPressed(MOUSE_BUTTON_LEFT))
        return;

    Vector2 mouse = GetMousePosition();

    if (CheckCollisionPointRec(mouse, startButton))
    {
        running = true;
    }

    if (CheckCollisionPointRec(mouse, stopButton))
    {
        running = false;
    }
}

void ScratchUI::draw()
{
    // Top-Bar
    DrawRectangle(
        0,
        0,
        GetScreenWidth(),
        50,
        LIGHTGRAY);

    // START
    DrawRectangleRec(
        startButton,
        GREEN);

    DrawText(
        "START",
        static_cast<int>(startButton.x + 24),
        static_cast<int>(startButton.y + 7),
        16,
        WHITE);

    // STOP
    DrawRectangleRec(
        stopButton,
        RED);

    DrawText(
        "STOP",
        static_cast<int>(stopButton.x + 28),
        static_cast<int>(stopButton.y + 7),
        16,
        WHITE);
}
