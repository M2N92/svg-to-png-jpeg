"use strict";

(function() {
    var doc = document,
        png = doc.getElementById('dl_png'),
        jpeg = doc.getElementById('dl_jpeg'),
        textarea = doc.getElementsByTagName('textarea');

    png.onclick = function() { 
        var svg = new Svg(textarea[0].value, 'png');

        if (svg.str !== undefined) { svg.convert(); }
    };

    jpeg.onclick = function() {
        var svg = new Svg(textarea[0].value, 'jpeg');

        if (svg.str !== undefined) { svg.convert(); }
    };

    /**
     * @param {string} str - The svg string to be converted
     * @param {string} type - Image extension. Accepts 'jpeg' and 'png' only.
     * @constructor
     */
    function Svg(str, type) {
        var node;

        //Only accepts valid string.
        if (isValid(str) === false) { 
            console.error('Invalid SVG string.');
            return;
        }

        //Ensures addition of xmlns and xlink namespaces.
        str = str.replace(/ xmlns="(.+?)"| xmlns:xlink="(.+?)"/g, '');
        str = str.replace(/^<(.+?)( |>)/g, '<$1 xmlns="http://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink" $2');
        node = new DOMParser().parseFromString(str, 'image/svg+xml').documentElement;

        //Ensures that the SVG is able to parse before continuing.
        if (node.getElementsByTagName('parsererror').length > 0) {
            console.error('Unable to parse SVG string.');
            return;
        }

        this.str = str;
        this.type = ['jpeg', 'png'].indexOf(type) > -1 ? type : 'png';
        this.width = Number(node.getAttribute('width') || 300);
        this.height = Number(node.getAttribute('height') || 150);

        function isValid(str) {
            switch (str) {
                case '':
                case null:
                case undefined: return false;
                default: 
                    if (typeof str !== 'string') { return false; }
            }

            return true;
        }
    }

    Svg.prototype = {
        /**
         * For convenience.
        **/
        convert: function() {
            var me = this;

            me.blob()
            .then(function(result) { me.download(result); })
            .catch(function() { console.error('Unable to convert to blob.'); });
        },
        /**
         * Converts SVG string to a downloadable blob.
         * @returns {Promise}
        **/
        blob: function() {
            var me = this;

            return new Promise(function(resolve, reject) {
                var img = new Image(),
                    body = doc.getElementsByTagName('body'),
                    canvas = createCanvas(body, me.width, me.height),
                    URL = self.URL || self.webkitURL || self,
                    obj_url = URL.createObjectURL(new Blob([me.str], { type: 'image/svg+xml' }));

                img.onload = function () {
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    canvas.toBlob(function (blob) { resolve(blob); }, 'image/' + me.type);

                    URL.revokeObjectURL(obj_url);
                    body[0].removeChild(canvas);
                };

                img.onerror = function() { 
                    URL.revokeObjectURL(obj_url);
                    body[0].removeChild(canvas);
                    reject();
                };

                img.src = obj_url;
            });

            function createCanvas(body, width, height) {
                var canvas = doc.createElement('canvas');

                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);

                body[0].appendChild(canvas);

                return canvas;
            }
        },
        /**
         * Triggers download for the given blob.
         * @param {Blob} blob
        **/
        download: function(blob) {
            var a = doc.createElement('a'),
                body = doc.getElementsByTagName('body'),
                URL = self.URL || self.webkitURL || self;

            body[0].appendChild(a);
            a.setAttribute('download', 'svg_to_blob.' + this.type);
            a.setAttribute('href', URL.createObjectURL(blob));
            a.dispatchEvent(new MouseEvent('click'));
            URL.revokeObjectURL(a.getAttribute('href'));
            body[0].removeChild(a);
        }
    };
})();
