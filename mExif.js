/**
 *  memory efficient TIFF, Exif and GPS tags scanner
 *
 *  [Specification]
 *  version2.3: http://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf
 *
 *  author: Barbayar Dashzeveg
 *  email: barbayar.dashzeveg at gmail dot com
 */

var mExif = {
    _data: null,
    _offset: 0,
    _bigEndian: true,
    _constants: {
        // 2(JPEG header) + 2(APP0 header) + 65535(max APP0) + 2(APP1 header) + 65535(max APP1)
        MAX_SLICE_SIZE: 131076
    },
    _tagLabel: {
        TIFF: {
            256: 'ImageWidth',
            257: 'ImageLength',
            258: 'BitsPerSample',
            259: 'Compression',
            262: 'PhotometricInterpretation',
            270: 'ImageDescription',
            271: 'Make',
            272: 'Model',
            273: 'StripOffsets',
            274: 'Orientation',
            277: 'SamplesPerPixel',
            278: 'RowsPerStrip',
            279: 'StripByteCounts',
            282: 'XResolution',
            283: 'YResolution',
            284: 'PlanarConfiguration',
            296: 'ResolutionUnit',
            301: 'TransferFunction',
            305: 'Software',
            306: 'DateTime',
            315: 'Artist',
            318: 'WhitePoint',
            319: 'PrimaryChromaticities',
            513: 'JPEGInterchangeFormat',
            514: 'JPEGInterchangeFormatLength',
            529: 'YCbCrCoefficients',
            530: 'YCbCrSubSampling',
            531: 'YCbCrPositioning',
            532: 'ReferenceBlackWhite',
            33432: 'Copyright',
            34665: 'ExifIFDPointer',
            34853: 'GPSIFDPointer'
        },
        Exif: {
            33434: 'ExposureTime',
            33437: 'FNumber',
            34850: 'ExposureProgram',
            34852: 'SpectralSensitivity',
            34855: 'PhotographicSensitivity',
            34856: 'OECF',
            34864: 'SensitivityType',
            34865: 'StandardOutputSensitivity',
            34866: 'RecommendedExposureIndex',
            34867: 'ISOSpeed',
            34868: 'ISOSpeedLatitudeyyy',
            34869: 'ISOSpeedLatitudezzz',
            36864: 'ExifVersion',
            36867: 'DateTimeOriginal',
            36868: 'DateTimeDigitized',
            37121: 'ComponentsConfiguration',
            37122: 'CompressedBitsPerPixel',
            37377: 'ShutterSpeedValue',
            37378: 'ApertureValue',
            37379: 'BrightnessValue',
            37380: 'ExposureBiasValue',
            37381: 'MaxApertureValue',
            37382: 'SubjectDistance',
            37383: 'MeteringMode',
            37384: 'LightSource',
            37385: 'Flash',
            37386: 'FocalLength',
            37396: 'SubjectArea',
            37500: 'MakerNote',
            37510: 'UserComment',
            37520: 'SubSecTime',
            37521: 'SubSecTimeOriginal',
            37522: 'SubSecTimeDigitized',
            40960: 'FlashpixVersion',
            40961: 'ColorSpace',
            40962: 'PixelXDimension',
            40963: 'PixelYDimension',
            40964: 'RelatedSoundFile',
            40965: 'InteroperabilityIFDPointer',
            41483: 'FlashEnergy',
            41484: 'SpatialFrequencyResponse',
            41486: 'FocalPlaneXResolution',
            41487: 'FocalPlaneYResolution',
            41488: 'FocalPlaneResolutionUnit',
            41492: 'SubjectLocation',
            41493: 'ExposureIndex',
            41495: 'SensingMethod',
            41728: 'FileSource',
            41729: 'SceneType',
            41730: 'CFAPattern',
            41985: 'CustomRendered',
            41986: 'ExposureMode',
            41987: 'WhiteBalance',
            41988: 'DigitalZoomRatio',
            41989: 'FocalLengthIn35mmFilm',
            41990: 'SceneCaptureType',
            41991: 'GainControl',
            41992: 'Contrast',
            41993: 'Saturation',
            41994: 'Sharpness',
            41995: 'DeviceSettingDescription',
            41996: 'SubjectDistanceRange',
            42016: 'ImageUniqueID',
            42032: 'CameraOwnerName',
            42033: 'BodySerialNumber',
            42034: 'LensSpecification',
            42035: 'LensMake',
            42036: 'LensModel',
            42037: 'LensSerialNumber',
            42240: 'Gamma'
        },
        GPS: {
            0: 'GPSVersionID',
            1: 'GPSLatitudeRef',
            2: 'GPSLatitude',
            3: 'GPSLongitudeRef',
            4: 'GPSLongitude',
            5: 'GPSAltitudeRef',
            6: 'GPSAltitude',
            7: 'GPSTimeStamp',
            8: 'GPSSatellites',
            9: 'GPSStatus',
            10: 'GPSMeasureMode',
            11: 'GPSDOP',
            12: 'GPSSpeedRef',
            13: 'GPSSpeed',
            14: 'GPSTrackRef',
            15: 'GPSTrack',
            16: 'GPSImgDirectionRef',
            17: 'GPSImgDirection',
            18: 'GPSMapDatum',
            19: 'GPSDestLatitudeRef',
            20: 'GPSDestLatitude',
            21: 'GPSDestLongitudeRef',
            22: 'GPSDestLongitude',
            23: 'GPSDestBearingRef',
            24: 'GPSDestBearing',
            25: 'GPSDestDistanceRef',
            26: 'GPSDestDistance',
            27: 'GPSProcessingMethod',
            28: 'GPSAreaInformation',
            29: 'GPSDateStamp',
            30: 'GPSDifferential',
            31: 'GPSHPositioningError'
        }
    },
    debugMode: false,
    _log: function(message) {
        if (!this.debugMode) {
            return;
        }

        console.log('[mExif] ' + message);
    },
    _readByte: function() {
        return this._data.charCodeAt(this._offset++);
    },
    _readASCII: function() {
        return this._data.charAt(this._offset++);
    },
    _readShort: function() {
        var byte0 = this._readByte();
        var byte1 = this._readByte();

        if (this._bigEndian) {
            return byte0 * 256 + byte1;
        }

        return byte1 * 256 + byte0;
    },
    _readLong: function() {
        var byte0 = this._readByte();
        var byte1 = this._readByte();
        var byte2 = this._readByte();
        var byte3 = this._readByte();

        if (this._bigEndian) {
            return byte0 * 16777216 + byte1 * 65536 + byte2 * 256 + byte3;
        }

        return byte3 * 16777216 + byte2 * 65536 + byte1 * 256 + byte0;
    },
    _readRational: function() {
        var numerator = this._readLong();
        var denominator = this._readLong();

        return numerator + ' / ' + denominator;
    },
    _readSLong: function() {
        var tempLong = this._readLong();

        if (tempLong > 2147483647) {
            return this._readLong() - 4294967296;
        }

        return tempLong;
    },
    _readSRational: function() {
        var numerator = this._readSLong();
        var denominator = this._readSLong();

        return numerator + ' / ' + denominator;
    },
    _readIFD: function() {
        var nextIFDOffset = this._offset + 12;
        var tag = this._readShort();
        var type = this._readShort();
        var count = this._readLong();
        var isOffset = false;
        var value = [];

        switch (type) {
            case 1: // byte
                if (count > 4) isOffset = true;
                break;
            case 2: // ascii
                if (count > 3) isOffset = true;
                break;
            case 3: // short
                if (count > 2) isOffset = true;
                break;
            case 4: // long
                if (count > 1) isOffset = true;
                break;
            case 5: // rational
                isOffset = true;
                break;
            case 7: // undefined
                if (count > 4) isOffset = true;
                break;
            case 9: // signed long
                if (count > 1) isOffset = true;
                break;
            case 10: // signed rational
                isOffset = true;
                break;
            default:
                this._log('unknown type: ' + type);
                this._offset = nextIFDOffset;

                return null;
        }

        if (isOffset) {
            this._offset = this._readLong();
        }

        for (var i = 0; i < count; i++) {
            switch (type) {
                case 1: // byte
                    value.push(this._readByte());
                    break;
                case 2: // ascii
                    value.push(this._readASCII());
                    break;
                case 3: // short
                    value.push(this._readShort());
                    break;
                case 4: // long
                    value.push(this._readLong());
                    break;
                case 5: // rational
                    value.push(this._readRational());
                    break;
                case 7: // undefined
                    value.push(this._readASCII());
                    break;
                case 9: // signed long
                    value.push(this._readSLong());
                    break;
                case 10: // signed rational
                    value.push(this._readSRational());
                    break;
            }
        }

        if (type === 2) {
            // last character is always \0
            value.pop();
        }

        if (type === 2 || type === 7) {
            value = value.join('');
        }

        this._offset = nextIFDOffset;

        return {
            tag: tag,
            value: value
        }
    },
    _readIFDs: function(tagLabel) {
        var tagCount = this._readShort();
        var tags = {};

        this._log(tagCount + ' tags found');

        for (var i = 0; i < tagCount; i++) {
            var ifd = this._readIFD();

            if (ifd === null) {
                continue;
            }

            if (!tagLabel[ifd.tag]) {
                this._log('couldn\'t find a label for ' + ifd.tag);
                tags[ifd.tag] = ifd.value;
            } else {
                tags[tagLabel[ifd.tag]] = ifd.value;
            }
        }

        return tags;
    },
    _getSlice: function(file) {
        if (file.slice) {
            return file.slice(0, this._constants.MAX_SLICE_SIZE);
        } else if (file.webkitSlice) {
            return file.webkitSlice(0, this._constants.MAX_SLICE_SIZE);
        } else if (file.mozSlice) {
            return file.mozSlice(0, this._constants.MAX_SLICE_SIZE);
        }

        return file;
    },
    _checkSOI: function(jpegData) {
        var soi = jpegData.substring(0, 2);

        if (soi !== String.fromCharCode(0xFF, 0xD8)) {
            this._log('not a JPEG file');

            return false;
        }

        return true;
    },
    _getAPP1: function(jpegData) {
        var offset = 2;

        while (offset < this._constants.MAX_SLICE_SIZE - 3) {
            var appNHeader = jpegData.charCodeAt(offset) * 256 + jpegData.charCodeAt(offset + 1);
            var appNLength = jpegData.charCodeAt(offset + 2) * 256 + jpegData.charCodeAt(offset + 3);
            
            if (appNHeader < 0xFFE0 || appNHeader > 0xFFEF) {
                this._log('couldn\'t find APPn header');

                return null;
            }

            if (appNHeader !== 0xFFE1) {
                this._log('skipping APP' + (appNHeader - 0xFFE0));
                offset += 2 + appNLength;

                continue;
            }

            return jpegData.substring(offset, offset + 2 + appNLength);
        }

        this._log('couldn\'t find APP1 header');

        return null;
    },
    _getTIFF: function(app1Data) {
        var exifHeader = app1Data.substring(4, 10);
        var tiffHeader = app1Data.substring(10, 14);

        if (exifHeader !== String.fromCharCode(0x45, 0x78, 0x69, 0x66, 0x00, 0x00)) {
            this._log('couldn\'t find Exif header');

            return null;
        }

        if (tiffHeader === String.fromCharCode(0x49, 0x49, 0x2A, 0x00)) {
            // little endian
            this._log('Endianness: little');
            this._bigEndian = false;
            this._offset = app1Data.charCodeAt(17) * 16777216 + app1Data.charCodeAt(16) * 65536 + app1Data.charCodeAt(15) * 256 + app1Data.charCodeAt(14);
        } else if (tiffHeader === String.fromCharCode(0x4D, 0x4D, 0x00, 0x2A)) {
            // big endian
            this._log('Endianness: big');
            this._bigEndian = true;
            this._offset = app1Data.charCodeAt(14) * 16777216 + app1Data.charCodeAt(15) * 65536 + app1Data.charCodeAt(16) * 256 + app1Data.charCodeAt(17);
        } else {
            this._log('couldn\'t find TIFF header');

            return null;
        }

        // 2(APP1 header) + 2(APP1 size) + 6(Exif header) = 10
        // return APP1 data with TIFF header
        return app1Data.substring(10);
    },
    scan: function(file, callback) {
        var instance = this;
        var tiffTags = {};
        var exifTags = {};
        var gpsTags = {};
        var fileSlice = this._getSlice(file);

        fileReader = new FileReader();
        fileReader.onload = function () {
            if (!instance._checkSOI(this.result)) {
                callback(tiffTags);

                return;
            }

            var app1Data = instance._getAPP1(this.result);

            if (app1Data === null) {
                callback(tiffTags);

                return;
            }

            instance._data = instance._getTIFF(app1Data);

            if (instance._data === null) {
                callback(tiffTags);

                return;
            }

            instance._log('scanning TIFF tags');
            tiffTags = instance._readIFDs(instance._tagLabel.TIFF);

            if (tiffTags['ExifIFDPointer']) {
                instance._log('scanning Exif tags');
                instance._offset = tiffTags['ExifIFDPointer'];
                exifTags = instance._readIFDs(instance._tagLabel.Exif);
            }

            if (tiffTags['GPSIFDPointer']) {
                instance._log('scanning GPS tags');
                instance._offset = tiffTags['GPSIFDPointer'];
                gpsTags = instance._readIFDs(instance._tagLabel.GPS);
            }

            callback({
                TIFF: tiffTags,
                Exif: exifTags,
                GPS: gpsTags
            });
        };
        fileReader.readAsBinaryString(fileSlice);
    }
}
