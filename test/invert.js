var BitmapJS = require("../index");
var Bitmap = BitmapJS.Bitmap;

var filename = process.argv[2];

var bm = new Bitmap();
bm.readFile(filename)
    .then(function() {
        var neg = bm.negative();
        var suffix = filename.substr(-4);
        var negFilename = filename.replace(suffix, '.neg' + suffix);
        return neg.writeFile(negFilename);
    })
    .then(function() {
        console.log("Done");
    })
    .catch(function(error) {
        console.log(error.message);
    });