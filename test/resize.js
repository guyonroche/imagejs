var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

var filename = process.argv[2];
var width = parseInt(process.argv[3]);
var height = parseInt(process.argv[4]);
var algorithm = process.argv[5] || "nearestNeighbor";

var bm = new Bitmap();
bm.readFile(filename, BitmapJS.ImageType.JPG)
    .then(function() {
        var bm2 = bm.resize({width: width, height: height, algorithm: algorithm});
        var filename2 = filename.replace('.jpg', '.' + width + 'x' + height + '.jpg');
        return bm2.writeFile(filename2, BitmapJS.ImageType.JPG);
    })
    .then(function() {
        console.log("Done");
    });