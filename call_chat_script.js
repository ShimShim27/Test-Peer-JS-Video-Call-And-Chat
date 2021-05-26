//use the proper stun and turn servers
var peer = new Peer(uuidv4(),{
	host: 'videodesk-ennesimo.herokuapp.com',
	port: 443,
	secure:true,
	config: {'iceServers': [
		
		{url:'stun:stun.l.google.com:19302'},
		{url:'stun:stun1.l.google.com:19302'},
		{url:'stun:stun2.l.google.com:19302'},
		{url:'stun:stun3.l.google.com:19302'},
		{url:'stun:stun4.l.google.com:19302'},
		
		{
			url: 'turn:numb.viagenie.ca',
			credential: 'muazkh',
			username: 'webrtc@live.com'
		},
		{
			url: 'turn:192.158.29.39:3478?transport=udp',
			credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
			username: '28224511:1379330808'
		},
		{
			url: 'turn:192.158.29.39:3478?transport=tcp',
			credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
			username: '28224511:1379330808'
		}
		]}
})







var conn;
var stream;
var cams;
var camInUse;

//get user's video stream
getStream();



peer.on('open',function(id){
	document.getElementById("my_peer_id").innerText = id;
})




peer.on('connection',function(dataconnection){
	
	const messages = document.getElementById("messages")
	
	messages.innerText = messages.innerText + "\nSomebody joined !"
	
	
	dataconnection.on('open',function(){

		//when there are no existing connection , connect back to the offerer
		if(conn == null) connectToPeer(dataconnection.peer);
		


		dataconnection.on('data',function(data){
			messages.innerText = messages.innerText + "\nOther: " + data;
		})
	})
	
		
})






//when error happened
peer.on('error',function(err){
	console.log(err)
})




//when call is received
peer.on('call',function(call){
	console.log("somebody calling")
	call.answer(stream)
	addStreamReceivedListener(call)
			
})




//on click connect peer button
function clickConnectToPeer(){
	const target_id = document.getElementById("target_id");
	connectToPeer(target_id.value);
}




//connect to peer
function connectToPeer(peerId){
	const conn_status = document.getElementById("conn_status");
	
	
	conn_status.innerText = "Connecting"
	conn = peer.connect(peerId)
	
	
	conn.on('open',function(){
		conn_status.innerText = "Connected"
		callPeer();
		
	})
	
	
}



//send message
function sendMessage(){
	const to_be_sent = document.getElementById("to_be_sent")
	const messages = document.getElementById("messages")
	const val = to_be_sent.value
	
	conn.send(val)
	messages.innerText = messages.innerText + "\nYou: " + val;
	
	to_be_sent.value = "";
}




//clear messages in message box
function clearMessage(){
	const messages = document.getElementById("messages")
	messages.innerText = ""
}




//do call in peer
function callPeer(){
	const target_id = document.getElementById("target_id");
	const call = peer.call(target_id.value,stream);
	addStreamReceivedListener(call)
	console.log("calling")

}




//get video stream from the user cam
function getStream(){
	/*
		Overload resolution failed -> https://stackoverflow.com/questions/27120757/failed-to-execute-createobjecturl-on-url/33759534

		Requested device not found GetUserMedia -> try to tenable your camera and microphone

		The code came from -> https://www.tutorialspoint.com/webrtc/webrtc_media_stream_apis.htm
	*/


	  navigator.mediaDevices.enumerateDevices().then(function(devices) {
	      var cameras = [];
	      devices.forEach(function(device) {
	        
			if('videoinput' == device.kind) cameras.push(device.deviceId);
			
	      });
	     

		  
		  var cameraID;
		  

		  //use undefined because null and empty values don't work
		  if(cameras.length <= 1) cameraID = undefined;
		  else cameraID = cameras[0];
		  


		  showVideoStream(cameraID,cameras);

	});
}







//show the stream video
function showVideoStream(cameraID,cameras){
	var constraints = {video: {deviceId: {exact: cameraID}}};
	camInUse = cameraID;	//set the passed  camera id as the one in use


  	navigator.getUserMedia(constraints, function (dataStream) {
		  stream = dataStream;

		  var video = document.getElementById('my_vid');
		  video.srcObject = stream;
		  
		  cams = cameras;

		  
	   }, function (err) {
		alert(err)
	});
	
	
}

	





//when a video stream received
function addStreamReceivedListener(call){
	call.on('stream',function(stream){
			console.log("stream is coming")
			var video = document.getElementById("incoming_vid"); 
			video.srcObject =stream;
	})
}



//toggle camera to front or back
function changeCam(){
	//if only one cam
	if(cams.length<=1) alert("This is the only cam")
	else {

		//remove and stop existing track first
		const existingTrack = stream.getTracks()[0];
		existingTrack.stop();
		stream.removeTrack(existingTrack)


		//the new camera to be use
		camInUse = cams[0] == camInUse? cams[1]:cams[0]
	

		//initiate new stream
		var constraints = {video: {deviceId: {exact: camInUse}}};
		navigator.getUserMedia(constraints, function (dataStream) {
			  
			  
				stream = dataStream;

				var video = document.getElementById('my_vid');
				video.srcObject = dataStream;



				if(conn != null && conn != undefined){
					//new call with new stream
					const call = peer.call(conn.peer,stream);
					addStreamReceivedListener(call)
				}
				
			  

		   }, function (err) {
			alert(err)
		});


	
	}


}




//turn of video 
function turnOffVideo() {
	var vidEnabled = stream.getTracks()[0].enabled 
	stream.getTracks()[0].enabled  = vidEnabled == false
}



//turn off audio
function turnOffAudio() {
	var audioEnabled = stream.getTracks()[0].muted 
	stream.getTracks()[0].muted  = audioEnabled == false
}





//Creates uuid for our id. Code from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	return v.toString(16);
  });
}


