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

var _ = require("underscore");
var Promise = require("bluebird");

var Enums = require("./enums");
var Utils = require("./utils");

// default pad colour
var transparentBlack = {
    r: 0, g: 0, b: 0, a: 0
};

var Graphics = module.exports = function(bitmap) {
    this.bitmap = bitmap;
};

Graphics.prototype = {
    get width() {
        return this.bitmap.width;
    },
    get height() {
        return this.bitmap.height;
    },
    get buffer() {
        return this.bitmap._data.data;
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
        var buffer = this.buffer;
        buffer[pos++] = r;
        buffer[pos++] = g;
        buffer[pos++] = b;
        buffer[pos++] = a;
    },
    getPixel: function(x,y, color) {
        var pos = (y * this.width + x) * 4;
        color = color || {};
        var buffer = this.buffer;
        color.r = buffer[pos++];
        color.g = buffer[pos++];
        color.b = buffer[pos++];
        color.a = buffer[pos++];
        return color;
    },
    
    fillRect: function(left, top, width, height, options) {
        // to do this properly requires a brush class that can return a color for a given x,y
        // position (i.e. texture painting). Can the texture be transformed?
        // Can the rect be transformed?
        
        var fillColor = options.fillColor;
        this.bitmap._fill(fillColor, left, top, width, height);
    },
    
    drawLine: function(x1,y1,x2,y2, options) {
        
    },
    
    drawImage: function(image, options) {

        // left,top,width,height refer to draw window in dst
        var dstLeft = options.left || 0;
        var dstTop = options.top || 0;
        var dstWidth = options.width || image.width;
        var dstHeight = options.height || image.height;        
        if ((dstWidth != image.width) || (dstHeight != image.height)) {
            image = image.resize({width: dstWidth, height: dstHeight, algorithm: "bezierInterpolation"});
        }
        
        // this.bitmap's dimensions
        var bmpWidth = this.width;
        var bmpHeight = this.height;
        var bmpW4 = bmpWidth * 4;
        
        // source image crop window
        var srcLeft = 0;
        var srcTop = 0;
        var srcWidth = image.width;
        var srcHeight = image.height;
        
        // crop dstLeft,dstTop,dstWidth,dstHeight to this.bitmap
        if (dstLeft < 0) {
            dstWidth = dstWidth + dstLeft;
            srcLeft = srcLeft - dstLeft;
            dstLeft = 0;
        }
        if (dstTop < 0) {
            dstHeight = dstHeight + dstTop;
            srcTop = srcTop - dstTop;
            dstTop = 0;
        }
        if (dstLeft > bmpWidth) return;
        if (dstTop > bmpHeight) return;
        if (dstWidth <= 0) return;
        if (dstHeight <= 0) return;
        
        //console.log("_blt: left="+left + ", top="+top + ", width="+width + ", height="+height)
        var srcBuf = image._data.data;
        var dstBuf = this.buffer;
        
        var dstL4 = dstLeft * 4;
        var srcL4 = srcLeft * 4;
        var srcW4 = srcWidth * 4;
        
        for (var i = 0; i < dstHeight; i++) {
            var srcPos = (i + srcTop) * srcW4 + dstL4;
            var dstPos = (i + dstTop) * bmpW4 + dstL4;
            
            for (var j = 0; j < dstWidth; j++) {
                var srcR = srcBuf[srcPos++];
                var srcG = srcBuf[srcPos++];
                var srcB = srcBuf[srcPos++];
                var srcA = srcBuf[srcPos++];
                
                if (srcA === 255) {
                    dstBuf[dstPos++] = srcR;
                    dstBuf[dstPos++] = srcG;
                    dstBuf[dstPos++] = srcB;
                    
                    // destination transparency not affected
                    dstPos++;
                } else if (srcA === 0) {
                    dstPos += 4;
                } else {
                    var dstR = dstBuf[dstPos];
                    dstBuf[dstPos++] = Math.round((srcR * srcA + dstR * (255-srcA)) / 255);
                    
                    var dstG = dstBuf[dstPos];
                    dstBuf[dstPos++] = Math.round((srcG * srcA + dstG * (255-srcA)) / 255);
                    
                    var dstB = dstBuf[dstPos];
                    dstBuf[dstPos++] = Math.round((srcB * srcA + dstB * (255-srcA)) / 255);
                    
                    dstPos++;
                }
            }
        }
    }
}