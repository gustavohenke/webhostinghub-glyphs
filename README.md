# WebHostingHub Glyphs Bower repository
This is a Bower repository for [WebHostingHub Glyphs](http://webhostinghub.com/glyphs).

## Install
The repository is installable via Bower (d'oh!):

```shell
bower install webhostinghub-glyphs
```

For development purposes, it's recommended that you clone the repo and follow the build instructions.

## Build
Run the commands below in order to build and download the font.

```shell
npm install
node build/script.js
```

The tasks done by the build script are:

* Fix inconsistent glyph names in SVG font
* Download font package from [Fontello API](http://fontello.com/)
* Unzip it locally

## License
MIT