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
var SvgPath = require( "svgpath" );
var wrench = require( "wrench" );
var stripJsonComments = require( "strip-json-comments" );

// Initialize fontello config
var fontelloCfg = {};

// Read SVG contents and parse it
var svg = fs.readFileSync( path.resolve( __dirname, "../libs/webhostinghub-glyphs/WebHostingHub-Glyphs.svg" ), "utf8" );

// Fix uni* glyph names
svg = svg.replace( /glyph-name="uni[a-f0-9]{4}" unicode="(.+?)"/gi, "glyph-name=\"$1\" unicode=\"$1\"" );

xml2js.parseString( svg, function( err, result ) {
    var json;
    var cfgFile = path.join( __dirname, "config.json" );
    var font = result.svg.defs[ 0 ].font[ 0 ];
    var fontFace = font[ "font-face" ][ 0 ].$;
    var unicodeStart = parseInt( "0xE000", 16 );

    fontelloCfg.name = "webhostinghub-glyphs";
    fontelloCfg.ascent = +fontFace[ "ascent" ];
    fontelloCfg.units_per_em = +fontFace[ "units-per-em" ];
    fontelloCfg.css_use_suffix = false;
    fontelloCfg.css_prefix_text = "icon-";
    fontelloCfg.hinting = true;
    fontelloCfg.glyphs = font.glyph.map( getGlyphParser( fontFace, unicodeStart ) ).filter(function( glyph ) {
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
    }).on( "complete", function( id, response ) {
        // Remove config.json file
        fs.unlinkSync( cfgFile );

        // Not a succesful request?
        if ( response.statusCode >= 400 ) {
            console.error( "ERROR! " + id );
            return process.exit( 1 );
        }

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
    var ret, content, file, ext;

    // If there's more than 2 argvs (node script.js), we'll slice it and try to read as a file
    if ( process.argv.length > 2 ) {
        file = process.argv[ 2 ];
        ext = file.split( "." ).pop().toLowerCase();

        ret = {};

        try {
            content = fs.readFileSync( path.resolve( process.cwd(), file ), "utf8" );
            if ( ext === "txt" ) {
                content = content.split( "\n" ).map(function( ln ) {
                    // Trim and split by spaces each line.
                    // 1st item will be the original name, and the 2nd item will be the new name
                    ln = ln.trim().split( /\s+/ );
                    return ln;
                });
            } else if ( ext === "json" ) {
                content = JSON.parse( stripJsonComments( content ) );

                if ( !Array.isArray( content ) ) {
                    // We'll use keys as original name, and values as renamed icons
                    content = Object.keys( content ).map(function( key ) {
                        return [ key, content[ key ] ];
                    });
                }
            } else {
                content = [];
                console.log( "Unsupported file type: " + ext );
            }

            content.forEach(function( item ) {
                if ( typeof item === "string" ) {
                    item = [ item, item ];
                }

                ret[ item[ 0 ] ] = item[ 1 ] || item[ 0 ];
            });
        } catch ( e ) {}
    }

    return ret;
}

/**
 * Return a parser for glyphs
 *
 * @param   {Number} unicodeStart   The unicode char to start from
 * @returns {Function}
 */
function getGlyphParser( root, unicodeStart ) {
    // Init externally selected icons
    // This will be used to filter out the icons by their name
    var selected = getSelectedIcons();
    var hasSelection = selected && Object.keys( selected ).length;

    if ( hasSelection ) {
        console.log( "%d selected icons", hasSelection );
    }

    return function parseGlyphObject( glyph, i ) {
        var name, renamed, d;
        var searchTerms = [];

        glyph = glyph.$;
        d = glyph.d;

        // Has SVG path?
        if ( !d ) {
            return;
        }

        // Uses glyph-name, unless it's so stupid.
        name = glyph[ "glyph-name" ];
        if ( /^uni[a-f0-9]{4}$/.test( name ) || name.indexOf( "NameMe" ) > -1 ) {
            name = glyph.unicode;
        }

        // Init the variable with the current name
        renamed = name;

        // When a selection is available, let's analyze it to determine what's the renamed icon
        if ( hasSelection ) {
            renamed = selected[ glyph.unicode ];
        }

        d = new SvgPath( d.replace( /\r?\n/g, " " ) )
            .scale( 1, -1 )
            .translate( 0, +root.ascent )
            .abs()
            .round( 1 )
            .toString();

        // Create unique search terms
        searchTerms.push( renamed || name );
        if ( ( renamed || name ) !== name ) {
            searchTerms.push( name );
        }

        return {
            css: renamed || name,
            src: "custom_icons",
            code: unicodeStart + i,
            selected: hasSelection ? !!renamed : true,
            svg: {
                path: d,
                width: 1000 // FIXME
            },
            search: searchTerms
        };
    };
}