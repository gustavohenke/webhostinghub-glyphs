#!/usr/bin/env node
"use strict";

// Constants
var FONTELLO_HOST = "http://fontello.com/";

// Requires
var path = require( "path" );
var fs = require( "fs" );
var xml2js = require( "xml2js" );
var restler = require( "restler" );
var AdmZip = require( "adm-zip" );
var wrench = require( "wrench" );

// Initialize fontello config
var fontelloCfg = {};

// Read SVG contents and parse it
var svg = fs.readFileSync( path.resolve( __dirname, "../libs/webhostinghub-glyphs/WebHostingHub-Glyphs.svg" ), "utf8" );

xml2js.parseString( svg, function( err, result ) {
    var json;
    var cfgFile = path.join( __dirname, "config.json" );
    var font = result.svg.defs[ 0 ].font[ 0 ];
    var fontFace = font[ "font-face" ][ 0 ].$;
    var unicodeRange = fontFace[ "unicode-range" ].replace( "U+", "" ).split( "-" );
    var unicodeStart = parseInt( "0x" + unicodeRange[ 0 ], 16 );

    fontelloCfg.name = "webhostinghub-glyphs";
    fontelloCfg.ascent = +fontFace[ "ascent" ];
    fontelloCfg.units_per_em = +fontFace[ "units-per-em" ];
    fontelloCfg.css_use_suffix = false;
    fontelloCfg.css_prefix_text = "icon-";
    fontelloCfg.glyphs = [];

    fontelloCfg.glyphs = font.glyph.map( getGlyphParser( unicodeStart ) ).filter(function( glyph ) {
        return glyph;
    });

    // Write the config file
    json = JSON.stringify( fontelloCfg );
    fs.writeFileSync( cfgFile, json );
    console.log( "Created Fontello config file" );

    restler.post( FONTELLO_HOST, {
        multipart: true,
        data: {
            config: restler.file( cfgFile, "config.json", json.length, null, "application/json" )
        }
    }).on( "complete", function( id ) {
        // Remove config.json file
        fs.unlinkSync( cfgFile );
        console.log( "Fontello Session initiated, ID: " + id );

        restler.get( FONTELLO_HOST + id + "/get", {
            // Decoding must be buffer in order to zip download correctly
            decoding: "buffer"
        }).on( "complete", function( zip ) {
            var dir;
            var zipOutput = path.join( __dirname, "font" );

            // Create the zip file locally
            var zipFile = path.join( __dirname, "font.zip" );
            fs.writeFileSync( zipFile, zip );
            console.log( "Downloaded and saved zip file" );

            // Unzip contents and delete zip file
            new AdmZip( zipFile ).extractAllTo( zipOutput, true );
            fs.unlinkSync( zipFile );

            // Get the fontello directory
            dir = fs.readdirSync( zipOutput );
            dir = path.join( zipOutput, dir[ 0 ] );

            // Copy things
            console.log( "Copying files" );
            wrench.copyDirSyncRecursive(
                path.join( dir, "font" ),
                path.resolve( process.cwd(), "font" ),
                { forceDelete: true }
            );
            wrench.copyDirSyncRecursive(
                path.join( dir, "css" ),
                path.resolve( process.cwd(), "css" ),
                { forceDelete: true }
            );

            wrench.rmdirSyncRecursive( zipOutput );
            console.log( "Finished installation." );
        });
    });
});

// -------------------------------------------------------------------------------------------------

/**
 * Read a file passed via argv and return selected icons.
 * If the file does not exist, or the format is unsupported, no icon is selected.
 *
 * @returns {String[]|void}
 */
function getSelectedIcons() {
    var selected, file, ext;

    // If there's more than 2 argvs (node script.js), we'll slice it and try to read as a file
    if ( process.argv.length > 2 ) {
        file = process.argv[ 2 ];
        ext = file.split( "." ).pop().toLowerCase();

        try {
            selected = fs.readFileSync( path.resolve( process.cwd(), file ), "utf8" );
            if ( ext === "txt" ) {
                selected = selected.split( "\n" ).map(function( ln ) {
                    return ln.trim();
                });
            } else if ( ext === "json" ) {
                selected = JSON.parse( selected );
                selected = Array.isArray( selected ) ? selected : null;
            } else {
                selected = null;
                console.log( "Unsupported file type: " + ext );
            }
        } catch ( e ) {}
    }

    return selected;
}

/**
 * Return a parser for glyphs
 *
 * @param   {Number} unicodeStart   The unicode char to start from
 * @returns {Function}
 */
function getGlyphParser( unicodeStart ) {
    // Init externally selected icons
    // This will be used to filter out the icons by their name
    var selected = getSelectedIcons();
    selected = selected && selected.length ? selected : null;

    if ( selected ) {
        console.log( "%d selected icons", selected.length );
    }

    return function parseGlyphObject( glyph, i ) {
        var name;

        glyph = glyph.$;

        // Has SVG path?
        if ( !glyph.d ) {
            return;
        }

        // Uses glyph-name, unless it's so stupid.
        name = glyph[ "glyph-name" ];
        if ( /^uni[a-f0-9]{4}$/.test( name ) || name.indexOf( "NameMe" ) > -1 ) {
            name = glyph.unicode;
        }

        return {
            css: name,
            src: "custom_icons",
            code: unicodeStart + i,
            selected: !( selected && selected.indexOf( name ) === -1 ),
            svg: {
                path: glyph.d,
                width: 1000 // FIXME
            },
            search: [
                name
            ]
        };
    };
}