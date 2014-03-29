// Global handle to module
var ImageProcModule = null;

// Global status message
var statusText = 'NO-STATUS';

var lastClick = null;

function pageDidLoad() {
  var video = document.getElementById("live");
  var display = document.getElementById("display");
  var context = display.getContext("2d");

  navigator.webkitGetUserMedia(
    {video:true, audio:false}, 
    function (stream) {
      video.src = window.URL.createObjectURL(stream);
      draw( video, context);
    },
    function (err) {
      console.log("Unable to get media stream:" + err.Code );
    });

  var listener = document.getElementById("listener");
  listener.addEventListener("load", moduleDidLoad, true );
  listener.addEventListener("message", handleMessage, true );
  if ( ImageProcModule == null ) {
    updateStatus( 'LOADING...' );
  } else {
    updateStatus();
  }

  // Set up interace
  var go = document.getElementById("go");
  go.addEventListener("onclick", sendImage );
}

function draw(v,c) {
  c.drawImage(v, 0, 0);
  setTimeout( draw, 20, v, c); // Redraw every 20ms
}

function sendImage() {
  // Get the current frame from canvas and send to NaCl
  var display = document.getElementById("display");
  var ctx = display.getContext( "2d" );
  var height = display.height;
  var width = display.width;
  var nBytes = height * width * 4; 
  var pixels = ctx.getImageData(0, 0, width, height);
  // drawImage( pixels );

  var theCommand = "process"; //"echo"; // test, process
  var cmd = { cmd: theCommand,  
              width: width, 
              height: height, 
              data: pixels.data.buffer, 
              processor: "Invert" };
  ImageProcModule.postMessage( cmd ); 
}

function drawImage(pixels){
    var processed = document.getElementById("processed");
    var ctx = processed.getContext( "2d" );
    var imData = ctx.getImageData(0,0,processed.width,processed.height);
    var buf8 = new Uint8ClampedArray( pixels );
    imData.data.set( buf8 );
    ctx.putImageData( imData, 0, 0);
}

function moduleDidLoad() {
  ImageProcModule = document.getElementById( "image_proc" );
  updateStatus( "OK" );
  var go = document.getElementById( "go" );
  // var modelList = document.getElementById( "model" );
  go.onclick = sendImage;
}

function handleMessage(message_event) {
  var res = message_event.data;
  if ( res.Type == "version" ) {
    updateStatus( res.Version );
    // updateModels( res.Models );
  }
  if ( res.Type == "completed" ) {
    if ( res.Data ) {
      // updateStatus( "Received array buffer");
      // Display processed image    
      drawImage( res.Data );
    } else {
      updateStatus( "Received something unexpected");
    }

    // Display processed image    
    //drawImage( res.Data );
  }
  if ( res.Type == "status" ) {
    updateStatus( res.Message );
  }
}

function updateStatus( optMessage ) {
  if (optMessage)
    statusText = optMessage;
  var statusField = document.getElementById("statusField");
  if (statusField) {
    statusField.innerHTML = " : " + statusText;
  }
}
