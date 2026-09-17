#pragma once

#include <stdio.h>

#include "tools/_dir_main.h"

int handle_init();

int handle_build();

int handle_run(int argc, char **argv);

int handle_help();

int handle_cmo(int argc, char **argv);

int handle_tagp(int argc, char **argv);

int handle_ign(int argc, char **argv);

//  /$$$$$$$  /$$$$$$ /$$   /$$
// | $$__  $$|_  $$_/| $$  | $$
// | $$  \ $$  | $$  | $$  | $$
// | $$  | $$  | $$  | $$$$$$$$
// | $$  | $$  | $$  | $$__  $$
// | $$  | $$  | $$  | $$  | $$
// | $$$$$$$/ /$$$$$$| $$  | $$
// |_______/ |______/|__/  |__/
