var _ = require("underscore");

var ImageJS = require("../index");
var Bitmap = ImageJS.Bitmap;

describe("Bitmap.blur", function() {
    var solidRed = {r: 255, g: 0, b: 0, a: 255};
    var solidBlue = {r: 0, g: 0, b: 255, a: 255};
    var solidWhite = {r: 255, g: 255, b: 255, a: 255};
    it("blurs lines", function() {
        var img1 = new Bitmap({width: 40, height: 30, color: solidWhite});
        for (var i = 0; i < 30; i++) {
            img1.setPixel(15,i, solidRed);
        }
        for (var i = 0; i < 40; i++) {
            img1.setPixel(i,15, solidRed);
        }
        var img2 = img1.blur();
        var color = {};
        
        //corners should still be white
        expect(img2.getPixel( 1, 1,color)).toEqual(solidWhite);
        expect(img2.getPixel(38, 1,color)).toEqual(solidWhite);
        expect(img2.getPixel( 1,28,color)).toEqual(solidWhite);
        expect(img2.getPixel(38,28,color)).toEqual(solidWhite);
        
        var checkPoints = function(points, min, max) {
            _.each(points, function(coords){
                color = img2.getPixel(coords.x,coords.y,color);
                //console.log(coords.x + "," + coords.y + " = " + JSON.stringify(color));
                expect(color.r).toEqual(255);
                expect(color.g).toBeLessThan(max);
                expect(color.g).toBeGreaterThan(min);
                expect(color.b).toBeLessThan(max);
                expect(color.b).toBeGreaterThan(min);
                expect(color.a).toEqual(255);
            });
        }
        
        // lines should be whitish red
        var lines = [
            {x: 0,y:15},  {x: 1,y:15},  {x: 8,y:15}, {x:20,y:15}, {x:38,y:15}, {x:39,y:15},
            {x:15,y: 0},  {x:15,y: 1},  {x:15,y: 8}, {x:15,y:20}, {x:15,y:28}, {x:15,y:29}
        ];
        checkPoints(lines, 120, 136);
        
        // near the cross should be redder
        var cross = [
                          {x:15,y:14},
            {x:14,y:15},  {x:15,y:15},  {x:16,y:15},
                          {x:15,y:16}
        ];
        checkPoints(cross, 50, 100);
        
        // beside lines should be reddish white
        var besides = [
            {x: 0,y:14},  {x: 1,y:14},  {x: 8,y:14}, {x:20,y:14}, {x:28,y:14}, {x:29,y:14},
            {x: 0,y:16},  {x: 1,y:16},  {x: 8,y:16}, {x:20,y:16}, {x:28,y:16}, {x:29,y:16},
            {x:14,y: 0},  {x:14,y: 1},  {x:14,y: 8}, {x:14,y:20}, {x:14,y:27}, {x:14,y:28},
            {x:16,y: 0},  {x:16,y: 1},  {x:16,y: 8}, {x:16,y:20}, {x:16,y:27}, {x:16,y:28}
        ];
        checkPoints(besides, 185, 195);
        
        var innerCorner = [
            {x:14,y:14},                {x:16,y:14},
            {x:14,y:16},                {x:16,y:16}
        ];
        checkPoints(innerCorner, 130, 150);
    });
});