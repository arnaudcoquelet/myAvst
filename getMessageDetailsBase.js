dojo.provide("webapp.myAVST.getMessageDetailsBase");
dojo.declare("webapp.myAVST.getMessageDetailsBase",[ICTouchAPI.webWidget,dojox.dtl._Templated],{

	callerId : "",
	callerName : "",

	constructor : function () {
		
	},
	
	postMixInProperties : function() {
		
	},
	
	postCreate:function(){
		var data = webapp.myAVST.data;
		var context	= this;
		var mediaFile = data.currentMessage.attachment;

		this.callerId = data.currentMessage.callerId;
		this.callerName = data.currentMessage.callerName;

		if(data.currentMessage) {
			data.messagePlayer = null;
			data.messagePlayer = new UIElements.Media.Audio(
			{
				intSliderX					: this.intSliderX,
				intSliderY					: this.intSliderY,
				intSliderWidth				: this.intSliderWidth,
				boolCanPause				: false,
				intMediaDuration			: 1000,
				boolSeekable				: false,
				strMediaPath				: mediaFile,
				clbkPlay					: function(){},
				clbkPause					: function(){},
				boolShowSliderButton		: false,
				boolIconOnSliderButton		: false

			}, this.domMPlayer);



			var state = data.currentMessage.newMessage == "New" ? 1 : 0;
			var stateOption = new UIElements.OptionChooser.OptionChooserControl({
						arrItems : [_("Read","webapp.myAVST"), _("UnRead","webapp.myAVST")],
						funcCallback : dojo.hitch(this.webapp, this.webapp.readStateChanged), 
						intIndex: state,
						boolShowTouch: false,
						intOptionWidth: 130,
					}, this.domMessageState);
		}
	},
	
	resetMediaBar : function() {
		if(data.messagePlayer) {
			data.messagePlayer.mediaPause();
			data.messagePlayer.setToTime(0);
		}
	},

});
