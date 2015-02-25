# ImageJS

Read, manipulate and write Images

Due to a lack of pure JavaScript Image manipulation libraries available, I decided to implement one.

This is an early release supporting only jpeg files and only the simplest resize algorithm but there will be more to come.

# Installation

npm install imagejs

# New Features!

<ul>
    <li>
        <a href="#image-resize">Enhanced Resize</a>
        <ul>
            <li>New Resize Algorithm: Bilinear Interpolation</li>
            <li>Stretch, Crop or Pad to Fit</li>
        </ul>
    </li>
    <li><a href="#reading-images">PNG Image files supported</a></li>
</ul>

# Coming Soon

<ul>
    <li>Bicubic Interpolation</li>
    <li>Crop</li>
    <li>Pad</li>
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
                    <li><a href="set-pixel">Set Pixel</a></li>
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

// Create a blank bitmap 320x200
var blankBitmap = new ImageJS.Bitmap({width: 320, height: 200});

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

```javascript
// Set a pixel
// where: 0 <= x < width, 0 <= y < height, 0 <= a,r,g,b < 256
bitmap.setPixel(x,y, a,r,g,b);

// Create a new bitmap that is a negative of the original
var negative = bitmap.negative();

// Create a new bitmap resized from an original

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

// resize to 300x200 bitmap using bilinear interpolation and padding to fit, pad color solid red
var thumbnail = bitmap.resize({
    width: 100, height: 150,
    algorithm: "bilinearInterpolation",
    fit: "pad",
    padColor: {r:255, g:0, b:0, a:255}
});

```

**Supported Resize Algorithms**
* nearestNeighbor
* bilinearInterpolation

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
bitmap.read(stream, ImageJS.ImageType.JPG)
    .then(function() {
        // bitmap is ready
    });

```

## Writing Images

```javascript
// write to a file
return bitmap.writeFile(filename)
    .then(function() {
        // bitmap has been saved
    });

// write PNG Image to a stream
var stream = createWriteStream();
return bitmap.write(stream, ImageJS.ImageType.PNG)
    .then(function() {
        // bitmap has been written and stream ended
    });


```

# Release History

| Version | Changes |
| ------- | ------- |
| 0.0.1 | Initial Version |
| 0.0.2 | <ul><li><a href="#image-resize">Enhanced Resize</a><ul><li>New Resize Algorithm: Bilinear Interpolation</li><li>Stretch, Crop or Pad to Fit</li></ul></li><li><a href="#reading-images">PNG Image files supported</a></li></ul> |

