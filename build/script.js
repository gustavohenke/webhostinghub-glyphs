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

// Replace uni* glyph-names with proper names from unicode attribute
var svg = fs.readFileSync( path.resolve( __dirname, "../libs/webhostinghub-glyphs/WebHostingHub-Glyphs.svg" ), "utf8" );
svg = svg.replace( /glyph-name="(.+?)" unicode="(.+?)"/g, "glyph-name=\"$2\" unicode=\"$2\"" );
console.log( "Fixed glyph names" );

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

    font.glyph.forEach(function( glyph, i ) {
        glyph = glyph.$;

        // Has SVG path?
        if ( !glyph.d ) {
            return;
        }

        fontelloCfg.glyphs.push({
            css: glyph[ "glyph-name" ],
            src: "custom_icons",
            code: unicodeStart + i,
            selected: true,
            svg: {
                path: glyph.d,
                width: 1000 // FIXME
            },
            search: [
                glyph[ "glyph-name" ]
            ]
        });
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
                path.resolve( __dirname, "../font" )
            );
            wrench.copyDirSyncRecursive(
                path.join( dir, "css" ),
                path.resolve( __dirname, "../css" )
            );

            wrench.rmdirSyncRecursive( zipOutput );
            console.log( "Finished installation." );
        });
    });
});