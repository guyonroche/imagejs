# ImageJS

A Pure JavaScript Image manipulation library.
 Read and write JPG and PNG image files or streams and perform a number of operations on them.
 

# Installation

npm install imagejs

# New Features!

<ul>
    <li><a href="#rotate">Rotate</a></li>
</ul>

# Backlog

<ul>
    <li>Graphics Object (draw and fill lines and shapes)</li>
</ul>

# Contents

<ul>
    <li>
        <a href="#interface">Interface</a>
        <ul>
            <li><a href="#creating-bitmaps">Creating Bitmaps</a></li>
            <li>
                <a href="#manipulating-bitmaps">Manipulating Bitmaps</a>
                <ul>
                    <li><a href="#set-pixel">Set Pixel</a></li>
                    <li><a href="#negative">Negative</a></li>
                    <li><a href="#blur">Blur</a></li>
                    <li><a href="#crop">Crop</a></li>
                    <li><a href="#resize">Resize</a></li>
                    <li><a href="#rotate">Rotate</a></li>
                </ul>
            </li>
            <li><a href="#reading-images">Reading Images</a></li>
            <li><a href="#writing-images">Writing Images</a></li>
        </ul>
    </li>
    <li><a href="#release-history">Release History</a></li>
</ul>



# Interface

```javascript
var ImageJS = require("imagejs");
```

## Creating Bitmaps

```javascript

// Create an uninitialized bitmap 320x200
// Note: the bitmap may be filled with random data
var bitmap = new ImageJS.Bitmap({width: 320, height: 200});

// Create a bitmap filled with green
var greenBitmap = new ImageJS.Bitmap({width: 100, height: 100, color: {r: 255, g: 255, b: 255, a: 255});

// Copy a bitmap
var copy = new ImageJS.Bitmap(otherBitmap);

// Create a bitmap and attach to supplied data structure
var attachedBitmap = new ImageJS.Bitmap({
    width: 100,
    height: 100,
    data: new Buffer(4 * 100 * 100)
});

// Create an empty (null) bitmap, ready for reading from file or stream
var nullBitmap = new ImageJS.Bitmap();

```

## Manipulating Bitmaps

### Set Pixel

```javascript
// Set a pixel
// where: 0 <= x < width, 0 <= y < height, 0 <= r,g,b,a < 256
bitmap.setPixel(x,y, r,g,b,a);

// Set a pixesl using a color object
var yellow = {r:255, g:255, b:0}; // alpha defaults to 255
bitmap.setPixel(x,y, yellow);
```

### Get Pixel

```javascript
// fetch the color of a pixel
var color = bitmap.getPixel(x,y);

// to improve performance you can supply the color object
var color = {};
color = bitmap.getPixel(x,y, color);
```

### Negative
```javascript
// Create a new bitmap that is a negative of the original
var negative = bitmap.negative();
```

### Blur
```javascript
// blur with simple gaussian filter
var blurred = bitmap.blur();
```

### Crop
```javascript
// create a new bitmap from a portion of another
var cropped = bitmap.crop({top: 50, left: 30, width: 100, height: 100});
```

### Resize
```javascript
// resize to 64x64 icon sized bitmap using nearest neighbor algorithm & stretch to fit
var thumbnail = bitmap.resize({
    width: 64, height: 64,
    algorithm: "nearestNeighbor"
});

// resize to 100x150 bitmap using bilinear interpolation and cropping to fit, gravity center
var thumbnail = bitmap.resize({
    width: 100, height: 150,
    algorithm: "bilinearInterpolation",
    fit: "crop",
    gravity: {x:0.5, y:0.5} // center - note: this is the default
});

// resize to 300x200 bitmap using bicubic interpolation and padding to fit, pad color solid red
var thumbnail = bitmap.resize({
    width: 300, height: 200,
    algorithm: "bicubicInterpolation",
    fit: "pad",
    padColor: {r:255, g:0, b:0, a:255}
});

```

**Supported Resize Algorithms**
* nearestNeighbor
* bilinearInterpolation
* bicubicInterpolation
* hermiteInterpolation
* bezierInterpolation

### Rotate
```javascript
// rotate image 0.5 radians counterclockwise, keeping the dimensions the same and padding with red
// Note: default fit is "same" so including it in options is optional
var red = {r: 255, g: 0, b: 0, a: 255};
var rotated = bitmap.rotate({radians: 0.5, fit: "same", padColor: red});

// rotate image 10 degrees clockwise, preserving entire image and padding with transparent white
var transparentWhite = {r: 255, g: 255, b: 255, a: 0};
var rotated = bitmap.rotate({degrees: -10, fit: "pad", padColor: transparentWhite});

// rotate image 45 degress counterclockwise, cropping so all of the result image comes from the source.
var rotated = bitmap.rotate({degrees: 45, fit: "crop"});

// rotate image 30 degrees counterclockwise, selecting custom dimensions. Note: image will not be scaled.
// default padColor (if required) is transparentBlack.
var rotated = bitmap.rotate({degrees: 30, fit: "custom", width: 100, height: 150});

```

## Reading Images

```javascript
// read from a file
var bitmap = new Bitmap();
bitmap.readFile(filename)
    .then(function() {
        // bitmap is ready
    });

// read JPG data from stream
var stream = createReadStream();
var bitmap = new Bitmap();
bitmap.read(stream, { type: ImageJS.ImageType.JPG })
    .then(function() {
        // bitmap is ready
    });

```

## Writing Images

```javascript
// write to a jpg file, quality 75 (default is 90)
return bitmap.writeFile("image.jpg", { quality:75 })
    .then(function() {
        // bitmap has been saved
    });

// write PNG Image to a stream
var stream = createWriteStream();
return bitmap.write(stream, {type: ImageJS.ImageType.PNG})
    .then(function() {
        // bitmap has been written and stream ended
    });

```

# Release History

| Version | Changes |
| ------- | ------- |
| 0.0.1 | Initial Version |
| 0.0.2 | <ul><li><a href="#image-resize">Enhanced Resize</a><ul><li>New Resize Algorithm: Bilinear Interpolation</li><li>Stretch, Crop or Pad to Fit</li></ul></li><li><a href="#reading-images">PNG Image files supported</a></li></ul> |
| 0.0.3 | <ul><li><a href="#image-resize">Enhanced Resize</a><ul><li>New Resize Algorithm: Bicubic Interpolation</li></ul></li></ul> |
| 0.0.5 | <ul><li><a href="#resizing-bitmaps">Enhanced Resize</a><ul><li>New Resize Algorithm: Bezier Interpolation</li><li>2 Pass algorithm to compensate for undersampling</li></ul></li><li><a href="blur">Blur Images</a></li><li><a href="crop">Crop Images</a></li></ul> |
| 0.0.6 | <ul><li>Internal Restructuring</li><li>Corrected Documentation</li><li>Better Bitmap Construction</li><li>Performance Improvements</li></ul> |
| 0.0.8 | <ul><li>Bug Fixes<ul><li>readFile this bug</li><li>resize same aspect ratio fix</li></ul></li></ul> |
| 0.0.9 | <ul><li><a href="#rotate">Rotate</a></li></ul>
