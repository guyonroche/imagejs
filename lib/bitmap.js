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

var Resize = require("./resize");

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
    read: function(stream, type) {
        var self = this;
        
        switch(type) {
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
                return Promise.reject(new Error("Not supported: ImageType " + type));
        }
    },
    readFile: function(filename, type) {
        type = type || this._deduceFileType(filename);
        var stream = fs.createReadStream(filename);
        return this.read(stream, type);
    },
    
    write: function(stream, type) {
        var deferred = Promise.defer();
        try {
            stream.on('finish', function() {
                deferred.resolve();
            });
            stream.on('error', function(error) {
                deferred.reject(error);
            });
            
            switch(type) {
                case Enums.ImageType.JPG:
                    var buffer = jpeg.encode(this._data, 50).data;
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
                    throw new Error("Not supported: ImageType " + type);
            }
        }
        catch(ex) {
            deferred.reject(ex);
        }
        return deferred.promise;
    },
    writeFile: function(filename, type) {
        type = type || this._deduceFileType(filename);
        var stream = fs.createWriteStream(filename);
        return this.write(stream, type);
    },
    
    setPixel: function(x,y,  r,g,b,a) {
        if (a === undefined) a = 255;
        var pos = 4 * (y * this.width + x);
        this.buffer[pos++] = r;
        this.buffer[pos++] = g;
        this.buffer[pos++] = b;
        this.buffer[pos++] = a;
    },
    
    negative: function() {
        var that = new Bitmap({width: this.width, height: this.height});
        var n = this.width * this.height;
        
        var src = this._data.data;
        var dst = that._data.data;
        for (var i = 0; i < n; i++) {
            var pos = i*4;
            dst[pos]   = 255 - src[pos];
            dst[pos+1] = 255 - src[pos+1];
            dst[pos+2] = 255 - src[pos+2];
            dst[pos+3] =       src[pos+3];
        }
        return that;
    },
    
    resize: function(options) {
        var that = new Bitmap(options);
        // crop determines from where in src to fetch image data
        options.crop = {
            left: 0, top: 0,
            width: this.width, height: this.height
        };
        // bounds determines where in dst to draw the scaled image
        options.bounds = {
            left: 0, top: 0,
            width: options.width, height: options.height
        };
        switch (options.fit) {
            case "pad": // fit all of src in dst with optional pad colour
                options.padColor = options.padColor || transparentBlack;
                var srcAr = this.width / this.height;
                var dstAr = that.width / that.height;
                var w2 = Math.round(srcAr * that.height);
                var h2 = Math.round(that.width / srcAr);
                if (w2 < that.width) {
                    // pad sides
                    var dw = that.width - w2;
                    options.bounds.left = Math.round(dw / 2);
                    options.bounds.width = w2;
                } else if (h2 < that.height) {
                    // pad top & bottom
                    var dh = that.height - h2;
                    options.bounds.top = Math.round(dh / 2);
                    options.bounds.height = h2;
                }
                break;
            case "crop": // crop original to fit in dst with no pad
                var gravity = options.gravity || {x: 0.5, y: 0.5};
                var dstAr = that.width / that.height;
                var w2 = Math.round(dstAr * this.height);
                var h2 = Math.round(this.width / dstAr);
                if (w2 < this.width) {
                    // crop src width
                    var dw = this.width - w2;
                    options.crop.left = Math.round(gravity.x * dw);
                    options.crop.width = w2;
                } else if (h2 < this.height) {
                    // crop src height
                    var dh = this.height - h2;
                    options.crop.top = Math.round(gravity.y * dh);
                    options.crop.height = h2;
                }
                break;
            case "stretch":
            default:
                // default crop and bounds are set above
                break;
        }
        
        Resize[options.algorithm](this, that, options);
        return that;
    }
}