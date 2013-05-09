module.exports = function( metrics, utils, stores ) {
  var fs = require( "fs" );

  return function( req, res ) {
    var image = req.files.image,
        urlPair = utils.generateFileName();

    fs.readFile( image.path, function( err, data ) {

      if ( err ) {
        res.json( 500, { error: "Failed to upload image. Reading file failed." } );
        metrics.increment( 'error.save.store-image' );
        return;
      }

      stores.images.write( urlPair.filename, data, image.type, function( error ) {

        if ( error ) {
          res.json( 500, { error: "Failed to upload image. Uploading file failed." } );
          metrics.increment( 'error.save.store-image' );
          return;
        }

        res.json( { url: urlPair.url } );
        metrics.increment( 'project.images-upload' );
      });
    });
  };
};
