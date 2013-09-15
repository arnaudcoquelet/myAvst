dojo.provide("webapp.myAVST.dataBase");
dojo.declare("webapp.myAVST.dataBase",null,{

	//Buttons
	BACK:"BACK_BTN",
	HOME:"HOME_BTN",
	DELETE: "DELETE_BTN",
	CALLBK: "CALLBK_BTN",
	CALLBACK: "CALLBACK_BTN",
	REPLY: "REPLY_BTN",
	PLAYVM: "PLAYVM_BTN",
	REWIND: "REWIND_BTN",
	FORWARD: "FORWARD_BTN",
	PLAY: "PLAY_BTN",
	PAUSE: "PAUSE_BTN",
	STOP: "STOP_BTN",
	FORWARDTO: "FORWARDTO_BTN",
	REFRESH: "REFRESH_BTN", 


	//VM/Media status
	NO_VOICEMAIL	: -1,
	STOP_STATUS		: 0,
	PLAY_STATUS		: 1,
	PAUSE_STATUS	: 2,
	ERROR_STATUS	: 3,

	//Media info
	messagePlayer			: null,
	strFilePath				: "",
	strIconPath				: "",
	_boolMPCapabilityEnable	: true,
	_boolTelephonyRunning	: false,
	_strContainerPath		: "",

	//MediaPlayer info
	intAreaX		: 20,
	intAreaY		: 5,
	intAreaWidth	: 450,
	intAreaHeight	: 200,
	intSliderX		: 43,
	intSliderY		: 215,
	intSliderWidth	: 390,

	strAvstListTitle		: _("VoiceMails", "webapp.myAVST"),
	strAvstContainerTitle	: _("Message Details", "webapp.myAVST"),


	messageContainerTitle	: _("No Message", "webapp.myAVST"),
	currentMessage			: null,
	indexCurrentMessage		: null,
	indexPreview			: null,
	
	//settings
	avstUrl					: null,
	avstServer				: null,
	avstDirectory			: null,
	avstSubscriber			: null,
	avstPassword			: null,
	avstMaxMessageCount		: null,
	avstRefreshTimer		:  5,
	avstEnablePreview		: null,

	
	//
	getMessagesTimeout: null,
	intNbVoiceMailEventNotified: 0,

	//Message List
	// Message: 
	//	callerId
	//  callerName (text)
	//  date
	//  lenght (in second of the message)
	//  newMessage (New or Saved)
	//  attachment (URL where is the wav file)
	
	arrMessages : [],
	arrMenuListItems : [],
	
	constructor:function(){
		var func=dojo.hitch(webapp.myAVST,webapp.myAVST.buttonCallback);
	},
	

	getMessages : function(){ 
	    return this.arrMessages; 
	},

	getMenuListItems : function(){ 
	    return this.arrMenuListItems;
	 },

});
