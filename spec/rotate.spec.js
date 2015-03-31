var _ = require("underscore");

var ImageJS = require("../index");
var Bitmap = ImageJS.Bitmap;

describe("Bitmap.resize", function() {
    var solidRed = {r: 255, g: 0, b: 0, a: 255};
    var solidBlue = {r: 0, g: 0, b: 255, a: 255};
    var solidGreen = {r: 0, g: 255, b: 0, a: 255};
    var solidWhite = {r: 255, g: 255, b: 255, a: 255};
    
    it("rotates 30 degrees", function() {
        var img1 = new Bitmap({width: 100, height: 100, color: solidWhite });
        
        // use _fill to create red and blue lines
        img1._fill(solidRed, 48, 48, 50, 4);
        img1._fill(solidBlue, 48, 48, 4, 50);
        
        var img2 = img1.rotate({degrees:30, fit: "same", padColor: solidGreen});
        
        // fit:"same" => dimensions are the same
        expect(img2.width).toEqual(img1.width);
        expect(img2.height).toEqual(img1.height);
        
        // corners should be padded with green
        expect(img2.getPixel( 1, 1)).toEqual(solidGreen);
        expect(img2.getPixel(98, 1)).toEqual(solidGreen);
        expect(img2.getPixel( 1,98)).toEqual(solidGreen);
        expect(img2.getPixel(98,98)).toEqual(solidGreen);
        
        // where the red and blue lines were, should be white
        expect(img2.getPixel(60, 50)).toEqual(solidWhite);
        expect(img2.getPixel(70, 50)).toEqual(solidWhite);
        expect(img2.getPixel(80, 50)).toEqual(solidWhite);
        expect(img2.getPixel(90, 50)).toEqual(solidWhite);
        
        expect(img2.getPixel(50, 60)).toEqual(solidWhite);
        expect(img2.getPixel(50, 70)).toEqual(solidWhite);
        expect(img2.getPixel(50, 80)).toEqual(solidWhite);
        expect(img2.getPixel(50, 90)).toEqual(solidWhite);
        
        // red and blue lines should be rotated
        expect(img2.getPixel(60, 44)).toEqual(solidRed);
        expect(img2.getPixel(70, 38)).toEqual(solidRed);
        expect(img2.getPixel(80, 32)).toEqual(solidRed);
        expect(img2.getPixel(90, 27)).toEqual(solidRed);
        
        expect(img2.getPixel(56, 60)).toEqual(solidBlue);
        expect(img2.getPixel(62, 70)).toEqual(solidBlue);
        expect(img2.getPixel(68, 80)).toEqual(solidBlue);
        expect(img2.getPixel(73, 90)).toEqual(solidBlue);
    });

});