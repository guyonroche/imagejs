var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

if (process.argv.length < 4) {
    console.log("Usage: node test/rotate filename degrees [fit] [width] [height]");
    console.log("   fit: one of pad, crop, same");
    process.exit(0);
}

var filename = process.argv[2];
var degrees = parseInt(process.argv[3]);
var fit = process.argv[4] || "same";
var width = parseInt(process.argv[5] || 0);
var height = parseInt(process.argv[6] || 0);
var bm = new Bitmap();
var red = {r:255,g:0,b:0,a:255};
bm.readFile(filename)
    .then(function() {
        if (!width || !height) {
            width = bm.width;
            height = bm.height;
        }
        var bm2 = bm.rotate({degrees: degrees, fit: fit, padColor: red, width: width, height: height});
        
        var suffix = filename.substr(-4);
        var dims = '.r' + degrees;
        var filename2 = filename.replace(suffix, dims + suffix);
        return bm2.writeFile(filename2, {quality: 80});
    })
    .then(function() {
        console.log("Done");
    })
    .catch(function(error) {
        console.log(error.message);
    });