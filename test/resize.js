var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

if (process.argv.length < 5) {
    console.log("Usage: node test/resize filename width height [algorithm] [fit]");
    console.log("   algorithm: one of nearestNeighbour, bilinearInterpolation, bicubicInterpolation, bezierInterpolation");
    console.log("   fit: one of pad, crop, stretch");
    process.exit(0);
}

var filename = process.argv[2];
var width = parseInt(process.argv[3]);
var height = parseInt(process.argv[4]);
var algorithm = process.argv[5] || "nearestNeighbor";
var fit = process.argv[6] || "stretch";
var bm = new Bitmap();
var red = {r:255,g:0,b:0,a:255};
bm.readFile(filename)
    .then(function() {
        var bm2 = bm.resize({width: width, height: height, algorithm: algorithm, fit: fit, padColor: red});
        
        var suffix = filename.substr(-4);
        var dims = '.' + width + 'x' + height;
        var filename2 = filename.replace(suffix, dims + suffix);
        return bm2.writeFile(filename2, {quality: 80});
    })
    .then(function() {
        console.log("Done");
    })
    .catch(function(error) {
        console.log(error.message);
    });