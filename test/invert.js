var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

var filename = process.argv[2];

var bm = new Bitmap();
bm.readFile(filename, BitmapJS.ImageType.JPG)
    .then(function() {
        var neg = bm.negative();
        var negFilename = filename.replace('.jpg', '.neg.jpg');
        return neg.writeFile(negFilename, BitmapJS.ImageType.JPG);
    })
    .then(function() {
        console.log("Done");
    });