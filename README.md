# ngrev

Graphical tool for reverse engineering of Angular projects. It allows you to navigate in the structure of your application and observe the relationship between the different modules, providers and directives. The tool performs **static code analysis** which means that you **don't have to run your application** in order to use it.

# How to use?

## macOS

1. Go to the [releases page](https://github.com/mgechev/ngrev/releases).
2. Download the latest `*.dmg` file.
3. Install the application.

## Linux

1. Go to the [releases page](https://github.com/mgechev/ngrev/releases).
2. Download the latest `*.AppImage` file.
3. Run the `*.AppImage` file (you may need to `chmod +x *.AppImage`).

## Windows

1. Go to the [releases page](https://github.com/mgechev/ngrev/releases).
2. Download the latest `*.exe` file.
3. Install the application.

## Application Requirements

Your application needs to be compatible with the Angular's AoT compiler (i.e. you should be able to compile it with `ngc`).

## Using with Angular CLI

1. Open the Angular's application directory.
2. Make sure the dependencies are installed.
3. Open `ngrev`.
4. Click on `Select Project` and select `[YOUR_CLI_APP]/src/tsconfig.app.json`.

## Using with Angular Seed

1. Open the Angular's application directory.
2. Make sure the dependencies are installed.
3. Open `ngrev`.
4. Click on `Select Project` and select `[YOUR_CLI_APP]/src/client/tsconfig.json`.

# Demo

Demo [here](https://www.youtube.com/watch?v=sKdsxdeLWjM).

<a href="https://s18.postimg.org/rvcikmxwp/1.png" target="_blank"><img src="https://s18.postimg.org/rvcikmxwp/1.png" alt="Module"/></a>

<a href="https://s18.postimg.org/aw3k5dmp5/2.png" target="_blank"><img src="https://s18.postimg.org/aw3k5dmp5/2.png" alt="Template with components"></a>

# License

MIT

