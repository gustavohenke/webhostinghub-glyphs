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

## Build
Run the commands below in order to build the font (requires you to have this package globally installed):

```shell
webhostinghub-glyphs
```

Optionally, you can pass a `.txt` or a `.json` file, where each line or each array item, respectively, correspond to icons to use from the font.
This helps avoiding large font files (WHH Glyphs is a _really_ large font bro!).

```shell
webhostinghub-glyphs file.txt
webhostinghub-glyphs file.json
```

The tasks done by the build script are:

* Fix inconsistent glyph names in SVG font
* Download font package from [Fontello API](http://fontello.com/)
* Unzip it in the current working directory

## License
MIT
