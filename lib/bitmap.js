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

var Enums = require("./enums");

var Resize = require("./resize");

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
    
    read: function(stream, type) {
        var self = this;
        var deferred = Promise.defer();
        
        var chunks = [];
        stream.on('data', function(chunk) {
            chunks.push(chunk);
        });
        stream.on('end', function() {
            var data = Buffer.concat(chunks);
            if (data) {
                try {
                    switch(type) {
                        case Enums.ImageType.JPG:
                            self._data = jpeg.decode(data);
                            break;
                        //case Enums.ImageType.PNG:
                        //    self._data = png.decode(data);
                        //    break;
                        default:
                            throw new Error("Not supported: ImageType " + type);
                    }
                    //console.log(JSON.stringify({width: self._data.width, height: self._data.height, data: (self._data.data != undefined)}));
                    deferred.resolve();
                }
                catch(ex) {
                    deferred.reject(ex);
                }
            } else {
                deferred.reject(new Error("No data found on stream"))
            }
        });
        
        return deferred.promise;
    },
    readFile: function(filename, type) {
        var stream = fs.createReadStream(filename);
        return this.read(stream, type);
    },
    
    write: function(stream, type) {
        var deferred = Promise.defer();
        try {
            var buffer;
            switch(type) {
                case Enums.ImageType.JPG:
                    buffer = jpeg.encode(this._data, 50).data;
                    break;
                //case Enums.ImageType.PNG:
                //    buffer = png.encode(this._data);
                //    break;
                default:
                    throw new Error("Not supported: ImageType " + type);
            }
            
            stream.on('finish', function() {
                deferred.resolve();
            });
            stream.on('error', function(error) {
                deferred.reject(error);
            });
            stream.write(buffer);
            stream.end();
        }
        catch(ex) {
            deferred.reject(ex);
        }
        return deferred.promise;
    },
    writeFile: function(filename, type) {
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
        Resize[options.algorithm](this, that);
        return that;
    }
}