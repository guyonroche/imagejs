/**
 * Copyright (c) 2015 Guyon Roche
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";

var fs = require("fs");
var _ = require("underscore");
var Promise = require("bluebird");
var jpeg = require("jpeg-js");
//var png = require("png-js");
var PNG = require("node-png").PNG;

var Enums = require("./enums");
var Utils = require("./utils");
var Resize = require("./resize");
//var Graphics = require("./graphics");

// default pad colour
var transparentBlack = {
    r: 0, g: 0, b: 0, a: 0
};

var Bitmap = module.exports = function(options) {
    if (options) {
        if (options instanceof Bitmap) {
            this._data = {
                data: new Buffer(options.data.data),
                width: options.width,
                height: options.height
            };
        } else if (options.data) {
            // attach to supplied data
            this._data = options;
        } else if (options.width && options.height) {
            // construct new bitmap
            this._data = {
                data: new Buffer(4 * options.width * options.height),
                width: options.width,
                height: options.height
            };
            
            // optional colour
            if (options.color) {
                this._fill(options.color);
            }
        }
    }
};

Bitmap.prototype = {
    get width() {
        return this._data.width;
    },
    get height() {
        return this._data.height;
    },
    //get graphics() {
    //    if (!this._graphics) {
    //        this._graphics = new Graphics(this);
    //    }
    //    return this._graphics;
    //},

    attach: function(data) {
        var prev = this._data;
        this._data = data;
        return prev;
    },
    detach: function() {
        var data = this._data;
        delete this._data;
        return data;
    },
    
    _deduceFileType: function(filename) {
        if (!filename) {
            throw new Error("Can't determine image type");
        }
        switch (filename.substr(-4).toLowerCase()) {
            case ".jpg":
                return Enums.ImageType.JPG;
            case ".png":
                return Enums.ImageType.PNG;
        }
        if (filename.substr(-5).toLowerCase() == ".jpeg") {
            return Enums.ImageType.JPG;
        }
        throw new Error("Can't recognise image type: " + filename);
    },
    
    _readStream: function(stream) {
        var self = this;
        var deferred = Promise.defer();
        
        var chunks = [];
        stream.on('data', function(chunk) {
            chunks.push(chunk);
        });
        stream.on('end', function() {
            var data = Buffer.concat(chunks);
            deferred.resolve(data);
        });
        stream.on('error', function(error) {
            deferred.reject(error);
        });
        
        return deferred.promise;
    },
    _readPNG: function(stream) {
        var deferred = Promise.defer();
        
        var png = new PNG({filterType: 4});
        png.on('parsed', function() {
            deferred.resolve(png);
        });
        png.on('error', function(error) {
            deferred.rejecyt(error);
        });
        stream.pipe(png);
        
        return deferred.promise;
    },
    _parseOptions: function(options, filename) {
        options = options || {};
        if (typeof options === "number") {
            options = { type: options };
        }
        options.type = options.type || this._deduceFileType(filename);
        return options;
    },
    read: function(stream, options) {
        var self = this;
        options = this._parseOptions(options);
        
        switch(options.type) {
            case Enums.ImageType.JPG:
                return this._readStream(stream)
                    .then(function(data) {
                        self._data = jpeg.decode(data);
                    });
            case Enums.ImageType.PNG:
                return this._readPNG(stream)
                    .then(function(png) {
                        self._data = {
                            data: png.data,
                            width: png.width,
                            height: png.height
                        };
                    });
            default:
                return Promise.reject(new Error("Not supported: ImageType " + options.type));
        }
    },
    readFile: function(filename, options) {
        var self = this;
        return Utils.fs.exists(filename)
            .then(function(exists) {
                if (exists) {
                    options = self._parseOptions(options, filename);
                    var stream = fs.createReadStream(filename);
                    return self.read(stream, options);
                } else {
                    throw new Error("File Not Found: " + filename);
                }
            });
    },
    
    write: function(stream, options) {
        options = this._parseOptions(options);
        var deferred = Promise.defer();
        try {
            stream.on('finish', function() {
                deferred.resolve();
            });
            stream.on('error', function(error) {
                deferred.reject(error);
            });
            
            switch(options.type) {
                case Enums.ImageType.JPG:
                    var buffer = jpeg.encode(this._data, options.quality || 90).data;
                    stream.write(buffer);
                    stream.end();
                    break;
                case Enums.ImageType.PNG:
                    var png = new PNG();
                    png.width = this.width;
                    png.height = this.height;
                    png.data = this._data.data;
                    png.on('end', function() {
                        deferred.resolve();
                    });
                    png.on('error', function(error) {
                        deferred.reject(error);
                    });
                    png.pack().pipe(stream);
                    break;
                default:
                    throw new Error("Not supported: ImageType " + options.type);
            }
        }
        catch(ex) {
            deferred.reject(ex);
        }
        return deferred.promise;
    },
    writeFile: function(filename, options) {
        options = this._parseOptions(options, filename);
        var stream = fs.createWriteStream(filename);
        return this.write(stream, options);
    },
    
    clone: function() {
        return new Bitmap({
            width: this.width,
            height: this.height,
            data: new Buffer(this._data.data)
        });
    },
    
    setPixel: function(x,y,  r,g,b,a) {
        if (g === undefined) {
            var color = r;
            r = color.r;
            g = color.g;
            b = color.b;
            a = color.a;
        }
        if (a === undefined) a = 255;
        var pos = (y * this.width + x) * 4;
        var buffer = this._data.data;
        buffer[pos++] = r;
        buffer[pos++] = g;
        buffer[pos++] = b;
        buffer[pos++] = a;
    },
    getPixel: function(x,y, color) {
        var pos = (y * this.width + x) * 4;
        color = color || {};
        var buffer = this._data.data;
        color.r = buffer[pos++];
        color.g = buffer[pos++];
        color.b = buffer[pos++];
        color.a = buffer[pos++];
        return color;
    },
    
    negative: function() {
        var that = new Bitmap({width: this.width, height: this.height});
        var n = this.width * this.height;
        
        var src = this._data.data;
        var dst = that._data.data;
        var srcPos = 0;
        var dstPos = 0;
        for (var i = 0; i < n; i++) {
            dst[dstPos++] = 255 - src[srcPos++];
            dst[dstPos++] = 255 - src[srcPos++];
            dst[dstPos++] = 255 - src[srcPos++];
            dst[dstPos++] =       src[srcPos++];
        }
        return that;
    },
    
    resize: function(options) {
        var that = new Bitmap(options);
        var temp;
        switch (options.fit) {
            case "pad": // fit all of src in dst with aspect ratio preserved.
                var padColor = options.padColor || transparentBlack;
                var srcAr = this.width / this.height;
                var w2 = Math.round(srcAr * that.height);
                var h2 = Math.round(that.width / srcAr);
                var wMargin = 0;
                var hMargin = 0;
                if (w2 < that.width) {
                    // pad sides
                    temp = new Bitmap({width: w2, height: that.height});
                    wMargin = (that.width - w2) / 2;
                    that._fill(padColor, 0, 0, Math.floor(wMargin), that.height);
                    that._fill(padColor, that.width - Math.ceil(wMargin), 0, Math.ceil(wMargin), that.height);
                    
                    Resize[options.algorithm](this, temp, options);
                    that._blt(temp, {left: Math.floor(wMargin), top: Math.floor(hMargin)});
                } else if (h2 < that.height) {
                    // pad top & bottom
                    temp = new Bitmap({width: that.width, height: h2});
                    hMargin = (that.height - h2) / 2;
                    that._fill(padColor, 0, 0, that.width, Math.floor(hMargin));
                    that._fill(padColor, 0, that.height - Math.ceil(hMargin), that.width, Math.ceil(hMargin));
                    
                    Resize[options.algorithm](this, temp, options);
                    that._blt(temp, {left: Math.floor(wMargin), top: Math.floor(hMargin)});
                } else {
                    // stretch straight into that
                    Resize[options.algorithm](this, that, options);
                }
                break;
            case "crop": // crop original to fit in dst with aspect ratio preserved
                var gravity = options.gravity || {x: 0.5, y: 0.5};
                var dstAr = that.width / that.height;
                var w2 = Math.round(dstAr * this.height);
                var h2 = Math.round(this.width / dstAr);
                if (w2 < this.width) {
                    // crop src width
                    var dw = this.width - w2;
                    temp = this.crop({left: Math.round(gravity.x * dw), top: 0, width: w2, height: this.height});
                } else if (h2 < this.height) {
                    // crop src height
                    var dh = this.height - h2;
                    temp = this.crop({left: 0, top: Math.round(gravity.y * dh), width: this.width, height: h2});
                } else {
                    temp = this;
                }
                Resize[options.algorithm](temp, that, options);
                break;
            case "stretch":
            default:
                Resize[options.algorithm](this, that, options);
                break;
        }
        
        return that;
    },
    
    rotate: function(options) {
        // TODO: crop, user supplied dst width, height
        
        // options.degrees || options.radians;
        // options.fit = ['pad','crop','same']
        // options.padColor
        var radians = options.radians !== undefined ? options.radians : 3.141592653589793 * options.degrees / 180;
        if (radians < 0.000000001) {
            return new Bitmap(this);
        }
        //console.log("radians=" + radians);
        
        var rotators = {
            forward: {
                cos: Math.cos(radians),
                sin: Math.sin(radians)
            },
            backward: {
                cos: Math.cos(-radians),
                sin: Math.sin(-radians)
            }
        }
        //console.log("cos=" + cos + ", sin=" + sin)
        
        var srcWidth = this.width;
        var srcHeight = this.height;
        var srcWidthHalf = srcWidth / 2;
        var srcHeightHalf = srcHeight / 2;
        
        var padColor = options.padColor || transparentBlack;
        var padArray = [padColor.r, padColor.g, padColor.b, padColor.a];
        var rotate = function(point, rotator) {
            // in-place rotation of point
            var x = rotator.cos * point.x - rotator.sin * point.y;
            var y = rotator.sin * point.x + rotator.cos * point.y;
            point.x = x;
            point.y = y;
            return point;
        };
        var cropToSource = function(point) {
            var m = Math.abs(point.x/srcWidthHalf);
            var n = Math.abs(point.y/srcHeightHalf);
            return Math.max(m,n);
        };
        
        var dstWidth, dstHeight;
        switch (options.fit) {
            case 'custom':
                dstWidth = options.width;
                dstHeight = options.height;
                break;
            case 'pad':
                // entire src fits in dst
                var tl = rotate({x:-srcWidthHalf,y:srcHeightHalf}, rotators.forward);
                var tr = rotate({x:srcWidthHalf,y:srcHeightHalf}, rotators.forward);
                var bl = rotate({x:-srcWidthHalf,y:-srcHeightHalf}, rotators.forward);
                var br = rotate({x:srcWidthHalf,y:-srcHeightHalf}, rotators.forward);
                dstWidth = Math.round(Math.max(tl.x,tr.x,bl.x,br.x) - Math.min(tl.x,tr.x,bl.x,br.x));
                dstHeight = Math.round(Math.max(tl.y,tr.y,bl.y,br.y) - Math.min(tl.y,tr.y,bl.y,br.y));
                break;
            case 'crop':
                var tl = rotate({x:-srcWidthHalf,y:srcHeightHalf}, rotators.forward);
                var tr = rotate({x:srcWidthHalf,y:srcHeightHalf}, rotators.forward);
                var bl = rotate({x:-srcWidthHalf,y:-srcHeightHalf}, rotators.forward);
                var br = rotate({x:srcWidthHalf,y:-srcHeightHalf}, rotators.forward);
                var d = Math.max(cropToSource(tl), cropToSource(tr), cropToSource(bl), cropToSource(br));
                dstWidth = Math.floor(srcWidth / d);
                dstHeight = Math.floor(srcHeight / d);
                break;
            case 'same':
            default:
                // dst is same size as src
                dstWidth = srcWidth;
                dstHeight = srcHeight;
                break;
        }
        
        var that = new Bitmap({width: dstWidth, height: dstHeight});
        
        var srcBuf = this._data.data;
        var dstBuf = that._data.data;
        
        // we will rotate the destination pixels back to the source and interpolate the colour
        var srcCoord = {};
        var dstWidthHalf = dstWidth / 2;
        var dstHeightHalf = dstHeight / 2;
        var dstWidth4 = dstWidth * 4;
        var srcWidth4 = srcWidth * 4;
        
        //console.log("src=[" + srcWidth + "," + srcHeight + "]")
        //console.log("dst=[" + dstWidth + "," + dstHeight + "]")
        for (var i = 0; i < dstHeight; i++) {
            for (var j = 0; j < dstWidth; j++) {
                // calculate src coords
                srcCoord.x = j - dstWidthHalf;
                srcCoord.y = dstHeightHalf - i;
                //console.log("x=" + srcCoord.x + ", y=" + srcCoord.y);
                rotate(srcCoord, rotators.backward);
                //console.log(" ==> x=" + srcCoord.x + ", y=" + srcCoord.y);
                
                // srcX and SrcY are in src coords
                var srcX = srcCoord.x + srcWidthHalf;
                var srcY = srcHeightHalf - srcCoord.y;
                //console.log("srcX=" + srcX + ", srcY=" + srcY);
                
                // now interpolate (bilinear!
                var dstPos = (i * dstWidth + j) * 4;
                //console.log("dstPos=" + dstPos)
                if ((srcX > -1) && (srcX < srcWidth) && (srcY > -1) && (srcY < srcHeight)) {
                    var srcPosX = Math.floor(srcX);
                    var srcPosY = Math.floor(srcY);
                    var srcPos = (srcPosY * srcWidth + srcPosX) * 4;
                    for (var k = 0; k < 4; k++) {
                        var kSrcPos = srcPos + k;
                        var kPad = padArray[k];
                        
                        var tl = ((srcX >= 0) && (srcY >= 0)) ? srcBuf[kSrcPos] : kPad;
                        var tr = ((srcX < srcWidth-1) && (srcY >= 0)) ? srcBuf[kSrcPos+4] : kPad;
                        var bl = ((srcX >= 0) && (srcY < srcHeight-1)) ? srcBuf[kSrcPos + srcWidth4] : kPad;
                        var br = ((srcX < srcWidth-1) && (srcY < srcHeight-1)) ? srcBuf[kSrcPos + srcWidth4 + 4] : kPad;
                        
                        var tx = srcX - srcPosX;
                        var ty = srcY - srcPosY;
                        
                        var t = (1-tx) * tl + tx * tr;
                        var b = (1-tx) * bl + tx * br;
                        dstBuf[dstPos++] = (1-ty) * t + ty * b;
                    }
                } else {
                    dstBuf[dstPos++] = padColor.r;
                    dstBuf[dstPos++] = padColor.g;
                    dstBuf[dstPos++] = padColor.b;
                    dstBuf[dstPos++] = padColor.a;
                }
            }
        }
        return that;
    },
    
    crop: function(options) {
        var t = options.top;
        var l = options.left;
        var w = options.width;
        var h = options.height;
        //console.log("Crop: l="+l + ", t="+t + ", w="+w + ", h="+h);
        
        var that = new Bitmap({width: w, height: h});
        
        var srcBuf = this._data.data;
        var dstBuf = that._data.data;
        
        var w4 = w * 4;
        for (var i = 0; i < h; i++) {
            var srcPos = ((i+t)*this.width + l) * 4;
            var dstPos = i * w * 4;
            srcBuf.copy(dstBuf, dstPos, srcPos, srcPos + w4);
        }
        return that;
    },
    
    blur: function(options) {
        // todo: expand to own file with different blur algorithms
        var that = new Bitmap({width: this.width, height: this.height});
        var w = this.width;
        var h = this.height;
    
        var W = w-1;
        var H = h-1;
    
        var V = w*4; // used for i offsets
    
        var src = this._data.data;
        var dst = that._data.data;
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                for (var k = 0; k < 4; k++) {
                    var pos = (i*w + j) * 4 + k;
                    var t = src[pos -(i>0?V:0) - (j>0?4:0)] * 1 + // 1/16
                            src[pos -(i>0?V:0)            ] * 2 + // 2/16
                            src[pos -(i>0?V:0) + (j<W?4:0)] * 1 + // 1/16
                            
                            src[pos            - (j>0?4:0)] * 2 + // 2/16
                            src[pos                       ] * 4 + // 4/16
                            src[pos            + (j<W?4:0)] * 2 + // 2/16
                            
                            src[pos +(i<H?V:0) - (j>0?4:0)] * 1 + // 1/16
                            src[pos +(i<H?V:0)            ] * 2 + // 2/16
                            src[pos +(i<H?V:0) + (j<W?4:0)] * 1;  // 1/16
                            
                    dst[pos] = Math.round(t/16);
                }
            }
        }
        return that;
    },
    
    _fill: function(color, l,t,w,h) {
        l = l || 0;
        t = t || 0;
        w = w || this.width - l;
        h = h || this.height - t;
        //console.log("Fill: l="+l + ", t="+t + ", w="+w + ", h="+h);
        
        color = color || transparentBlack;
        var r = color.r || 0;
        var g = color.g || 0;
        var b = color.b || 0;
        var a = color.a || 0;
        //console.log("     r="+r + ", g="+g + ", b="+b + ", a="+a);
        
        var buf = this._data.data;
        var bottom = t + h;
        var right = l + w;
        var width = this.width;
        
        // step 1 - build first scanline
        var pos1 = (t*width + l) * 4;
        var pos = pos1;
        for (var j = l; j < right; j++) {
            buf[pos++] = r;
            buf[pos++] = g;
            buf[pos++] = b;
            buf[pos++] = a;
        }
        
        // step 2 - copy first scanline to all the others
        var pos1End = pos1 + w * 4;
        for (var i = t; i < bottom; i++) {
            var pos = (i*width + l) * 4;
            buf.copy(buf, pos, pos1, pos1End);
        }
    },
    _blt: function(that, options) {
        var left = options.left;
        var top = options.top;
        var width = Math.min(this.width-left, that.width);
        var height = Math.min(this.height-top, that.height);
        //console.log("_blt: left="+left + ", top="+top + ", width="+width + ", height="+height)
        var w4 = width * 4;
        var srcBuf = that._data.data;
        var dstBuf = this._data.data;
        for (var i = 0; i < height; i++) {
            var srcPos = i * that.width * 4;
            var dstPos = ((i+top)*this.width + left) * 4;
            srcBuf.copy(dstBuf, dstPos, srcPos, srcPos + w4);
        }
    }
}