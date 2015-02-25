var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

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
        return bm2.writeFile(filename2);
    })
    .then(function() {
        console.log("Done");
    })
    .catch(function(error) {
        console.log(error.message);
    });