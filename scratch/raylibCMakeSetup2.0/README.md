# RaylibCmakeSetup 

**PS: This Template was modified by Shadowdara, more infos down below.**

<!--$$MD_INDEX_START$$-->
<!-- 
    Index by Automatic MD Index
    a simple Tool to Index your Markdown files like this

    More Infos:
    https://github.com/ShadowDara/automatic-md-index

    DO NOT REMOVE THIS CREDIT !!!

    Last Update Time of the Index: 
-->

## Index
- [RaylibCmakeSetup](#raylibcmakesetup)
  - [What is it?](#what-is-it)
- [IMPORTANT!](#important)
- [Shadowdara's modifications:](#shadowdaras-modifications)
<!-- Index by Automatic MD Index -->
<!--$$MD_INDEX_END$$-->

---

## What is it?

I already set up a Raylib project for you! Take it and enjoy! You don't need to know CMake!

![image](https://github.com/meemknight/raylibCmakeSetup/assets/36445656/c50ab777-0cde-4d80-8df6-a0fd483f169d)


<p>Opening the Solution:</p> 

<img src="https://raw.githubusercontent.com/meemknight/photos/master/llge1.gif" width="350">

Or

<img src="https://raw.githubusercontent.com/meemknight/photos/master/llge2.gif" width="500">

Running the setup

Go to CMakeLists.txt, <kbd>CTRL + S</kbd> to make sure the solution was built.

Then, from this dropdown select mygame.exe

<img src="https://raw.githubusercontent.com/meemknight/photos/master/llge3.gif" width="200">

<kbd>Ctrl + F5</kbd> to build (<kbd>F5</kbd> oppens the debugger, you usually want to press <kbd>Ctrl + F5</kbd> because it oppens faster like this.

<p>Adding files:<br>
You should add .cpp in src/ and .h in include/ Whenever you add a new file CMake will ask you if you want to add that thing, say NO every time! I am already adding all of the things automatically!
If you accidentally say YES, just remove that file from the CMake.lists
</p>

<p>Refreshing your changes:<br>
After you add a file, the changes should be automatically added but if you want to be sure, you can refresh changes by saving the CMake file. If you want to make a hard refresh (you might have to do that sometimes) close Visual Studio, delete the out folder, reopen VS, <kbd>CTRL + S</kbd> on CMakeLists.txt</p>


# IMPORTANT!
  To ship the game: 
  In Cmakelists.txt, set the PRODUCTION_BUILD flag to ON to build a shippable version of your game. This will change the file paths to be relative to your exe (RESOURCES_PATH macro), will remove the console, and also will change the asserts to not allow people to debug them. To make sure the changes take effect I recommend deleting the out folder to make a new clean build!


  Also, if you read the CMAKE, even if you don't know CMAKE you should understand what happens with the comments there and you can add libraries and also remove the console from there if you need to! (there is a commented line for that!)



# Shadowdara's modifications:

I updated the raylibCmakeSetup from meemknight and structure it a bit more

> i know some people wont like that i added the js ecosystem here for tools because of the big `node_modules` directory, but i tested it, its only **5mb** which i dont think is a big deal!

**my changes**: 

- I added new lib to the thirdparty directory
- I created a gameLayer and platformLayer to separate the game logic from the platform specific code
- Open `src/gameLayer/gameLayer.cpp` to start writing your game logic
- inside `include/platform/macros.hpp` at the top of the file you can find a lot of macros to configure your game, like window size, title, etc. You can change them there.
- I added tools from samengine (you can completly remove them if you want to, but I think they are useful)
	- seg, a tool to generate a link file for open source credits. You can install it via cargo (`cargo i samtool`) or with npm (`npm i @shadowdara/seg`) or just run npm i because i already added it to the package.json. To execute it, run `npx seg -l help` or `seg -l help` if you installed it globally or via cargo. This will display you the help menu for seg.
	- minisite, a tool bundle multiple markdown files into one single html file after parsing them to HTML. You can install it via (`npm i`).
	- to uninstall the samengine tools, delete:
		- package.json
		- package-lock.json
		- .samengine/
		- pages/
- I added some function like a version parser for the Version format *(MAJOR, MINOR, PATCH)*
- look into `utillity.cpp` and `ultility.hpp` to see more!
- added export with emscripten for the web. On windows run `npm i`, then `web_build.bat`, you need the emscripten sdk for that! And then `devserver.bat`.

PS: feel free to send me an PR, Issue or email at shadowdara74@gmail.com for questions, suggestions or anything else. I will be happy to help you!

**My blog**: [shadowdara.wordpress.com](https://shadowdara.wordpress.com)
