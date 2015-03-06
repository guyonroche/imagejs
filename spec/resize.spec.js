var _ = require("underscore");

var ImageJS = require("../index");
var Bitmap = ImageJS.Bitmap;

describe("Bitmap.resize", function() {
    var solidRed = {r: 255, g: 0, b: 0, a: 255};
    var solidBlue = {r: 0, g: 0, b: 255, a: 255};
    var solidWhite = {r: 255, g: 255, b: 255, a: 255};
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
    it("interpolates finer detail", function() {
        var img1 = new Bitmap({width: 40, height: 30, color: solidWhite});
        for (var i = 0; i < 30; i++) {
            img1.setPixel(15,i, solidRed);
        }
        for (var i = 0; i < 40; i++) {
            img1.setPixel(i,15, solidRed);
        }
        var img2 = img1.resize({width: 16, height: 12, algorithm: "bezierInterpolation"});
        var color = {};
        
        //corners should be white
        expect(img2.getPixel( 1, 1,color)).toEqual(solidWhite);
        expect(img2.getPixel(14, 1,color)).toEqual(solidWhite);
        expect(img2.getPixel( 1,10,color)).toEqual(solidWhite);
        expect(img2.getPixel(14,10,color)).toEqual(solidWhite);
        
        // lines should be reddish off-white
        var offWhites = [
            {x: 0,y: 6},  {x: 1,y: 6},  {x:8,y:6}, {x:14,y: 6}, {x:14,y: 6},
            {x: 6,y: 0},  {x: 6,y: 1},             {x: 6,y:10}, {x: 6,y:11}
        ];
        _.each(offWhites, function(coords){
            color = img2.getPixel(coords.x,coords.y,color);
            expect(color.r).toEqual(255);
            expect(color.g).toBeLessThan(253);
            expect(color.b).toBeLessThan(253);
        });
    });
    
    it("resizes same aspect ratios", function() {
        var img1 = new Bitmap({width: 250, height: 250, color: solidWhite});

        var img2a = img1.resize({width:150, height: 150, algorithm: "bezierInterpolation", fit: "pad"});
        var img2b = img1.resize({width:150, height: 150, algorithm: "bezierInterpolation", fit: "crop"});
        var img2c = img1.resize({width:150, height: 150, algorithm: "bezierInterpolation", fit: "stretch"});
        
        var img3a = img1.resize({width:446, height: 446, algorithm: "bezierInterpolation", fit: "pad"});
        var img3b = img1.resize({width:446, height: 446, algorithm: "bezierInterpolation", fit: "crop"});
        var img3c = img1.resize({width:446, height: 446, algorithm: "bezierInterpolation", fit: "stretch"});

    });
});