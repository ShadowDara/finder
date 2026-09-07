const fs = require("fs");

const data = JSON.parse(fs.readFileSync("Monster-Clicker/project.json", "utf8"));

// -------- GLOBAL STATE --------
let stateCounter = 0;
function nextState() {
    return stateCounter++;
}

// -------- COLLECT BROADCASTS --------
const broadcastSet = new Set();

data.targets.forEach(target => {
    Object.values(target.blocks).forEach(block => {

        if (block.opcode === "event_broadcast" || block.opcode === "event_broadcastandwait") {
            const input = block.inputs.BROADCAST_INPUT;
            if (input && Array.isArray(input[1])) {
                broadcastSet.add(input[1][1]);
            }
        }

        if (block.opcode === "event_whenbroadcastreceived") {
            const name = block.fields.BROADCAST_OPTION[0];
            broadcastSet.add(name);
        }
    });
});

// -------- Expression --------
function parseInput(input, blocks) {
    if (!input) return "0";

    if (Array.isArray(input[1])) {
        return input[1][1];
    }

    return compileExpression(blocks[input[1]], blocks);
}

function compileExpression(block, blocks) {
    switch (block.opcode) {
        case "operator_gt":
            return `(${parseInput(block.inputs.OPERAND1, blocks)} > ${parseInput(block.inputs.OPERAND2, blocks)})`;

        default:
            return "0";
    }
}

// -------- BLOCK → STATES --------
function compileBlocksToStates(startId, blocks) {
    let code = "";
    let current = startId;

    while (current) {
        const block = blocks[current];
        const state = nextState();

        code += `case ${state}:\n`;

        switch (block.opcode) {

            case "event_whenflagclicked":
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;

            case "event_whenthisspriteclicked": {
                const spriteName = block._targetName;
                code += `    if (!isSpriteClicked("${spriteName}")) return;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "event_whenbroadcastreceived": {
                const name = block.fields.BROADCAST_OPTION[0];
                const safe = name.replace(/[^a-zA-Z0-9]/g, "_");

                code += `    if (!broadcast_${safe}) return;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "event_broadcast": {
                const name = block.inputs.BROADCAST_INPUT[1][1];
                const safe = name.replace(/[^a-zA-Z0-9]/g, "_");

                code += `    broadcast_${safe} = true;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "event_broadcastandwait": {
                const name = block.inputs.BROADCAST_INPUT[1][1];
                const safe = name.replace(/[^a-zA-Z0-9]/g, "_");

                const waitState = nextState();

                code += `    broadcast_${safe} = true;\n`;
                code += `    t->waitBroadcast = true;\n`;
                code += `    t->state = ${waitState};\n    return;\n`;

                code += `case ${waitState}:\n`;
                code += `    if (broadcast_${safe}) return;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "looks_switchbackdropto": {
                const backdrop = block.inputs.BACKDROP[1];
                const name = blocks[backdrop].fields.BACKDROP[0];
                code += `    switchBackdrop("${name}");\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "data_setvariableto": {
                const name = block.fields.VARIABLE[0];
                const val = parseInput(block.inputs.VALUE, blocks);
                code += `    ${name} = ${val};\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "data_changevariableby": {
                const name = block.fields.VARIABLE[0];
                const val = parseInput(block.inputs.VALUE, blocks);
                code += `    ${name} += ${val};\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "control_wait_until": {
                const cond = compileExpression(blocks[block.inputs.CONDITION[1]], blocks);
                code += `    if (!(${cond})) return;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "control_wait": {
                const duration = parseFloat(parseInput(block.inputs.DURATION, blocks)) * 1000;
                const waitState = nextState();

                code += `    t->waitUntil = SDL_GetTicks() + ${duration};\n`;
                code += `    t->state = ${waitState};\n    return;\n`;

                code += `case ${waitState}:\n`;
                code += `    if (SDL_GetTicks() < t->waitUntil) return;\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "sound_play": {
                const sound = block.inputs.SOUND_MENU[1];
                const name = blocks[sound].fields.SOUND_MENU[0];
                code += `    playSound("${name}");\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            case "looks_nextbackdrop":
                code += `    nextBackdrop();\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;

            case "control_repeat": {
                const times = parseInput(block.inputs.TIMES, blocks);
                const loopState = nextState();
                const afterLoop = nextState();

                code += `    t->loopCounter = 0;\n`;
                code += `    t->state = ${loopState};\n    break;\n`;

                // loop start
                code += `case ${loopState}:\n`;
                code += `    if (t->loopCounter >= ${times}) {\n`;
                code += `        t->state = ${afterLoop};\n        break;\n    }\n`;

                // body
                let sub = block.inputs.SUBSTACK[1];
                while (sub) {
                    const b = blocks[sub];
                    code += `    ${compileInline(b, blocks)}\n`;
                    sub = b.next;
                }

                code += `    t->loopCounter++;\n`;
                code += `    t->state = ${loopState};\n    break;\n`;

                // after loop
                code += `case ${afterLoop}:\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
                break;
            }

            default:
                code += `    // unsupported ${block.opcode}\n`;
                code += `    t->state = ${state + 1};\n    break;\n`;
        }

        current = block.next;
    }

    return code;
}

// -------- Inline (für loops) --------
function compileInline(block, blocks) {
    switch (block.opcode) {
        case "looks_nextbackdrop":
            return `nextBackdrop();`;

        case "control_wait":
            return `t->waitUntil = SDL_GetTicks() + 170; return;`;

        default:
            return "// inline unsupported";
    }
}

// -------- BUILD ALL TASKS --------
let allTasksCode = "";
let setupCode = "";

data.targets.forEach(target => {

    const blocks = target.blocks;

    Object.keys(blocks).forEach(id => {
        const block = blocks[id];

        if (block.opcode.startsWith("event_")) {

            block._targetName = target.name;

            const states = compileBlocksToStates(id, blocks);

            const taskName = `task_${id.replace(/[^a-zA-Z0-9]/g, "")}`;

            allTasksCode += `
void ${taskName}(Task* t) {
    switch(t->state) {
${states}
    }
}
`;

            setupCode += `
tasks.push_back(new Task{0,false,0,0,false,&${taskName}});
`;
        }
    });
});

// -------- BROADCAST VARS --------
let broadcastVars = "";
let resetCode = "";

broadcastSet.forEach(name => {
    const safe = name.replace(/[^a-zA-Z0-9]/g, "_");
    broadcastVars += `bool broadcast_${safe} = false;\n`;
    resetCode += `    broadcast_${safe} = false;\n`;
});

// -------- FINAL OUTPUT --------
const cpp = `
#include "engine.h"
#include <vector>

int score = 0;

// Broadcasts
${broadcastVars}

struct Task {
    int state;
    bool finished;
    int loopCounter;
    Uint32 waitUntil;
    bool waitBroadcast;
    void (*func)(Task*);
};

std::vector<Task*> tasks;

${allTasksCode}

void runScheduler()
{
    for (auto t : tasks)
    {
        if (!t->finished)
        {
            t->func(t);
        }
    }

    // RESET BROADCASTS
${resetCode}
}

void setup()
{
    ${setupCode}
}
`;

fs.writeFileSync("generated.cpp", cpp);
console.log("DONE: generated.cpp");
