//Use the proper stun and turn servers. The host is not mine , use your own.
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







var conn;	//for chats
var mediaConnection	//for calls
var receivedConnection //obtained from peer on 'connection'

var stream;
var cams;
var camInUse;
var receivingCallsEnabled = true;



getStream();
addPeerListeners();




function addPeerListeners(){

	
	peer.on('open',function(id){
		document.getElementById("my_peer_id").innerText = id;

	})



	peer.on('connection',function(dataconnection){



		dataconnection.on('open',function(){


			if (!receivingCallsEnabled) {
				dataconnection.close();
				console.log("Incoming call dropped because receiving calls are disabled")
			}


			else if (receivedConnection != undefined){	
				dataconnection.close();
				console.log("Incoming call dropped because there is existing connection")
			}


			else {	
				showMessage("Somebody joined !!");


				//connect back to offerrer
				if(conn == null) connectToPeer(dataconnection.peer);
				


				dataconnection.on('data',function(data){
					showMessage("Other: " + data)
				})


				dataconnection.on('close',function(){
					endCall();	//using end call here instead in mediaConnection because that won't work according to https://github.com/peers/peerjs/issues/87
				})

				receivedConnection = dataconnection;		

			}


			
			
	

		})
		
			
			
				
	})






		
	peer.on('error',function(err){
		console.log(err)
		endCall();
	})




	
	peer.on('call',function(call){

		if(receivingCallsEnabled){
			console.log("somebody calling")
			addStreamReceivedListener(call)
			call.answer(stream)

		}
		
		
				
	})




	
}





function clickConnectToPeer(){
	const target_id = document.getElementById("target_id");
	connectToPeer(target_id.value);
}





function connectToPeer(peerId){
	if(receivingCallsEnabled){
		endCall();

		const conn_status = document.getElementById("conn_status");
		
		
		conn_status.innerText = "Connecting"
		conn = peer.connect(peerId)
		
		
		conn.on('open',function(){
			conn_status.innerText = "Connected"
			
			if(mediaConnection == undefined) callPeer();


		



			conn.on('close',function(){
				endCall();	//using end call here instead in mediaConnection because that won't work according to https://github.com/peers/peerjs/issues/87
			})



			
		})
	}


	else alert("Enable receiving calls first");




	
	
	
}




function sendMessage(){
	const to_be_sent = document.getElementById("to_be_sent")
	const val = to_be_sent.value
	
	conn.send(val)
	showMessage("You: " + val)
	
	to_be_sent.value = "";
}





function clearMessage(){
	const messages = document.getElementById("messages")
	messages.innerText = ""
}





function callPeer(){
	const target_id = document.getElementById("target_id");
	const call = peer.call(target_id.value,stream);
	addStreamReceivedListener(call)
	console.log("calling")

}








function endCall(){
	document.getElementById("conn_status").innerText = "Not Connected"

	var atLeastOneConnectionClosed = false;
	if(conn != undefined) {
		conn.close()
		atLeastOneConnectionClosed = true;
	}

	if(mediaConnection != undefined) {
		mediaConnection.close();
		atLeastOneConnectionClosed = true;
	}


	if(receivedConnection != undefined) {
		receivedConnection.close();
		atLeastOneConnectionClosed = true;
	}


	conn = undefined;
	mediaConnection = undefined;
	receivedConnection = undefined;
	



	if (atLeastOneConnectionClosed) {
		console.log("Connection closed")
		showMessage("Connection closed")
	}



}





function getStream(){
	/*
		Overload resolution failed -> https://stackoverflow.com/questions/27120757/failed-to-execute-createobjecturl-on-url/33759534

		Requested device not found GetUserMedia -> try to enable your camera and microphone
	*/


	  navigator.mediaDevices.enumerateDevices().then(function(devices) {
	      var cameras = [];
	      var audioID = "";
	      devices.forEach(function(device) {
	        
					if('videoinput' == device.kind) cameras.push(device.deviceId);
					else if('audioinput' == device.kind) audioID = device.deviceId;
			
	      });



	     

		  
		  var cameraID;
		  

		  //use undefined because null and empty values don't work

		  if(cameras.length <= 1) cameraID = undefined;
		  else cameraID = cameras[0];
		  
		  if(audioID.length <= 0) audioID = undefined;


		  showVideoStream(cameraID,cameras,audioID);

	});
}







//show the stream video
function showVideoStream(cameraID,cameras,audioID){
	var constraints = {video: {deviceId: cameraID} , 
		audio: {deviceId: audioID , echoCancellation:true , noiseSuppression:true}
	};


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
	mediaConnection = call;


	mediaConnection.on('stream',function(stream){
			console.log("stream is coming")
			var video = document.getElementById("incoming_vid"); 
			video.srcObject =stream;
	})



	mediaConnection.on('error',function(err){
		console.log("Error call: " + err)
		endCall();
	})


}




function changeCam(){
	
	if(cams.length<=1) alert("This is the only cam")
	else {

		//remove and stop existing track first
		const existingTrack = stream.getTracks()[0];
		existingTrack.stop();
		stream.removeTrack(existingTrack)

		const flipCameraX = (boolean)=>{
        const value = boolean?-1:1
        const myVid = document.getElementById("my_vid")
        myVid.style.transform = `scaleX(${value})`
        myVid.style.webkitTransform = `scaleX(${value})`
    }



    stream.getVideoTracks().forEach((track)=>{
        track.stop();
        stream.removeTrack(track)
    })



     if(cams[0] == camInUse){
        camInUse = cams[1];
        flipCameraX(false)
     }
     else{
        camInUse = cams[0];
        flipCameraX(true)
     }
	



		//initiate new stream
		var constraints = {video: {deviceId: {exact: camInUse}}};
		navigator.getUserMedia(constraints, function (dataStream) {
			  
			  
				stream = dataStream;

				var video = document.getElementById('my_vid');
				video.srcObject = dataStream;



				if(conn != null && conn != undefined){
		
					const call = peer.call(conn.peer,stream);
					addStreamReceivedListener(call)
				}
				
			  

		   }, function (err) {
			alert(err)
		});


	
	}


}





function toggleReceivingCallsEnabled(){
	receivingCallsEnabled = !receivingCallsEnabled

	var stat = "Receiving calls disabled";
	if(receivingCallsEnabled) stat = "Receiving calls enabled";

	document.getElementById("receiving_calls_stat").innerText = stat;
}





function toggleVideo() {
	const tracksList =stream.getVideoTracks();

  var vidEnabled = tracksList[0].enabled;
  tracksList.forEach(function(track){
      track.enabled = !vidEnabled;
  })
}




function toggleAudio() {
	 const tracksList =stream.getAudioTracks();

		var audioEnabled = tracksList[0].enabled;
		tracksList.forEach(function(track){
		    track.enabled = !audioEnabled;
		})
}





//Creates uuid for our id. Code from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	return v.toString(16);
  });
}




//for showing messages in message box
function showMessage(mess){
	const messages = document.getElementById("messages")
	messages.innerText += "\n" + mess;
}


