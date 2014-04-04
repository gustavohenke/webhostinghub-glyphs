# WebHostingHub Glyphs customizer
Bower repository and a Node.js customizer/builder for the iconic font [WebHostingHub Glyphs](http://webhostinghub.com/glyphs).

[![Dependency Status](https://david-dm.org/gustavohenke/webhostinghub-glyphs.png?theme=shields.io)](https://david-dm.org/gustavohenke/webhostinghub-glyphs)

## Install
The repository is installable via Bower (d'oh!):

```shell
bower install webhostinghub-glyphs
```

...and maybe from NPM, for people who like to build a custom iconic font, which will allow you to use
the `whhglyphs` or `webhostinghub-glyphs` commands in your CLI:

```shell
npm install -g webhostinghub-glyphs
```

When installing it globally, you'll have available 2 new commands: `webhostinghub-glyphs` and `whhglyphs`. They are the same thing.

## Building and customizing
Run the commands below in order to build the complete font:

```shell
webhostinghub-glyphs
```

Optionally, you can pass a `.txt` or a `.json` file name to select only a few icons from the font and optionally rename them.
This helps avoiding large font files (WHH Glyphs is a _really_ large font bro!).

```shell
webhostinghub-glyphs file.txt
webhostinghub-glyphs file.json
```

### `.txt` format
When using a `.txt` file to select your icons, each line must contain a valid icon name:

```
home
search
save
rss
```

This will only select `.icon-home`, `.icon-search`, `.icon-save` and `.icon-rss`.

To rename any icon, simply put whitespaces between the old name and the new name:

```
search magnifier
save
```

This way, `.icon-magnifier` and `.icon-save` will be made available.

### `.json` format
A `.json` file must contain a single array, where each item is a valid icon name:

```js
[
    "home",
    "search",
    "save",
    "rss"
]
```

This will only select `.icon-home`, `.icon-search`, `.icon-save` and `.icon-rss`.

To rename any icon, use an array, in the format `[ old name, new name ]`:

```js
[
    [ "search", "magnifier" ],
    "save"
]
```

This way, `.icon-magnifier` and `.icon-save` will be made available.

When using `.json` files, comments are allowed, they will be striped:

```js
[
    // Home icons
    "home",
    "search",
    "rss",

    // Content edit icons
    "save",
    "font"
]
```

## Tasks done by this tool

The tasks done by the build script are:

* Fix inconsistent glyph names in SVG font
* Decode glyph names with HTML entities
* Fix repeated icon names
* Unmirror and unshift each icon
* Download font package from [Fontello API](http://fontello.com/)
* Unzip it in the current working directory

## License
MIT
