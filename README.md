## mExif

mExif is a memory efficient TIFF, Exif and GPS tags scanner. You can use it for retrieving photo information on client side before upload.

usage:
```
mExif.debugMode = true;
mExif.scan(e.target.files[0], function(result) {
  $('#photoInfo').text(JSON.stringify(result, null, '\t'));
});
```
