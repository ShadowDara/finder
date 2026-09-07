#include <cmath>
#include "ScratchRuntime.hpp"
#include <raylib.h>

ScratchRuntime runtime;

static void startScript()
{
    runtime.sprite.moveSteps(10);
    runtime.sprite.turnRight(15);
}

int main()
{
    runtime.init(800, 600, "Scratch Project");
    
    startScript();
    
    while (!runtime.shouldClose())
    {
        runtime.update();
        
        BeginDrawing();
        ClearBackground(RAYWHITE);
        runtime.draw();
        EndDrawing();
    }
    
    runtime.shutdown();
    return 0;
}
