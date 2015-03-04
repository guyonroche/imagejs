var _ = require("underscore");

var ImageJS = require("../index");
var Bitmap = ImageJS.Bitmap;

describe("Bitmap.resize", function() {
    var solidRed = {r: 255, g: 0, b: 0, a: 255};
    var solidBlue = {r: 0, g: 0, b: 255, a: 255};
    it("pads top and bottom", function() {
        var img1 = new Bitmap({width: 100, height: 50, color: solidBlue });
        var img2 = img1.resize({width: 200, height: 200, algorithm: "bezierInterpolation", fit: "pad", padColor: solidRed});
        
        // expect top and bottom strips of red
        var color = {};
        var reds = [
            {x:0,y:0},   {x:100,y:0},   {x:199,y:0},   {x:0,y:49},  {x:100,y:49},  {x:199,y:49},
            {x:0,y:150}, {x:100,y:150}, {x:199,y:150}, {x:0,y:199}, {x:100,y:199}, {x:199,y:199}
        ];
        _.each(reds, function(coords){
            expect(img2.getPixel(coords.x, coords.y, color)).toEqual(solidRed);
        });
        
        // and a middle of blue
        var blues = [
            {x:0,y:50},  {x:100,y:50},  {x:199,y:50},  {x:0,y:100},  {x:100,y:100},  {x:199,y:100},
            {x:0,y:149}, {x:100,y:149}, {x:199,y:149}
        ];
        _.each(blues, function(coords){
            expect(img2.getPixel(coords.x, coords.y, color)).toEqual(solidBlue);
        });
    });
    it("pads left and right", function() {
        var img1 = new Bitmap({width: 30, height: 50, color: solidBlue });
        var img2 = img1.resize({width: 200, height: 200, algorithm: "bezierInterpolation", fit: "pad", padColor: solidRed});
        
        // expect top and bottom strips of red
        var color = {};
        var reds = [
            {x:0,y:0},   {x:0,y:100},   {x:0,y:199},   {x:25,y:0},  {x:25,y:100},  {x:25,y:199},
            {x:175,y:0}, {x:175,y:100}, {x:175,y:199}, {x:199,y:0}, {x:199,y:100}, {x:199,y:199}
        ];
        _.each(reds, function(coords){
            expect(img2.getPixel(coords.x, coords.y, color)).toEqual(solidRed);
        });
        
        // and a middle of blue
        var blues = [
            {x:50,y:0},  {x:50,y:100}, {x:50,y:199},
            {x:100,y:0}, {x:100,y:100}, {x:100,y:199},
            {x:150,y:0}, {x:150,y:100}, {x:150,y:199}
        ];
        _.each(blues, function(coords){
            expect(img2.getPixel(coords.x, coords.y, color)).toEqual(solidBlue);
        });
    });
});