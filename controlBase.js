dojo.provide("webapp.myAVST.controlBase");
dojo.declare("webapp.myAVST.controlBase", [ICTouchAPI.webApplication], {

	mainWidget : null,
	mainContainer : null,
	menuList : null,
	previewMenuList	: null,
	previewContainer : null,
	previewMenuClickHandler : null,

	menuListSelectedIndex : -1,
	intMessageListSelected : -1,

	objPopup : null,
	objServerPopup : null,

	intervalHandler : null,

	currentStatus	: 0,

	mediaFile: null,

	constructor: function ()
	{
		ICTouchAPI.tools.registerHomepageButton(["webapp.myAVST.getView","MYAVST_BTN","myAVST-application","myAVST"]);
		ICTouchAPI.tools.registerHomepageKey(["webapp.myAVST.getView","MYAVST_BTN","myAVST-application","myAVST"]);
	
		//
		ICTouchAPI.notificationServices.addNotification({
			strNotificationName: "New_AVST_VoiceMail",
			strNotificationLabel: _("AVST", "webapp.myAVST"),
			strNotificationIcon: "myAVST-voicemail-Notification",
			intNotificationValue: 0,
			callback: {
				context:"webapp.myAVST",
				func:this.onNotifyNewVoiceMail
			}
		});
	},

	load: function() {
		ICTouchAPI.eventServices.subscribeToEvent(this, "MPLoading", this.notifyPlayerLoading);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MPStopped", this.notifyPlayerStopped);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MPPlaying", this.notifyPlayerPlaying);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MPPaused", this.notifyPlayerPaused);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MPError", this.notifyPlayerError);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MPFinished", this.notifyPlayerFinished);
		ICTouchAPI.eventServices.subscribeToEvent(this, "MPState", this.notifyPlayerState);
        ICTouchAPI.eventServices.subscribeToEvent(this, "MediaSessionInfos", this.notifyMediaSessionInfosReceived);


		//PreLoad getView screen
		ICTouchAPI.transitionServices.preloadScreen({name: "webapp.myAVST.getView", params:  {}});

		//Load the settings
		this.updateAllSettings();

		//Refresh the messages
		this.getMessages();
	},

	buttonCallback : function (buttonId)
	{
		var data=webapp.myAVST.data;
		switch(buttonId){
			case data.BACK:dojo.publish("OpenHomepage");
			break;
		}
	},	

	
	//MESSAGES
	getMessagesDebug : function ()
	{
		//Remove old message	
		this.data.arrMessages.splice(0, this.data.arrMessages.length);
		this.data.arrMenuListItems.splice(0, this.data.arrMenuListItems.length);
		
		for (var i=0; i < 5; i++) {
			var d = new Date(2012, 12, i, Math.floor(Math.random()*24), Math.floor(Math.random()*60),0,0);
			
			var strTime = this.padLeft(d.getHours().toString(),2,'0') + ":" + this.padLeft(d.getMinutes().toString(),2,'0');
			var strDate = d.getFullYear().toString() + "/" + this.padLeft(d.getMonth().toString(),2,'0') + "/" + this.padLeft(d.getDay().toString(),2,'0') + " " + strTime;
			var strCallerId = "" + 1000 + Math.floor(Math.random()*1000).toString();
			var strCallerName = (Math.floor(Math.random()*2) > 0) ? "" : "Test Caller" + i.toString();
			var strLenght = Math.floor(Math.random()*300);
			var strNewMessage = (Math.floor(Math.random()*2) > 0) ? "new" : "old";
			var msgDetails = {date: strDate, callerId:strCallerId, callerName:strCallerName, length: strLenght, newMessage: strNewMessage };
			
			this.data.arrMessages.push(msgDetails);
			this.data.arrMenuListItems.push({intIndex: i, strPrimaryContent: strCallerName =="" ? strCallerId : strCallerName, strSecondaryContent: strDate, strPrimaryIcon: "myAVST-voicemail-new", messageDetails: msgDetails});
		}
	},
	
	getMessages : function ()
	{
		console.warn("getMessaes()");

		if(this.data)
		{
			if(this.data.avstUrl){
				var messageCount = this.data.avstMaxMessageCount || "5";
				var subscriber = this.data.avstSubscriber || "";
				var password = this.data.avstPassword || "";
				var avstServer = this.data.avstServer || "";
				var url = this.data.avstUrl + "/AVST/VoiceMail/" + avstServer + "/User/" + subscriber + "/" + password + "/Messages";

				this.httpRequest({
					url: url,
					method:"get",
					responseType:"text",
					timeout : 5000,
					callback:this.gotMessages,
					callbackError : this.errorOnHttpRequest,
					context:this
				});
			}
			else
			{
				this.updateAllSettings();
				var t=this;
        		setTimeout(function() {t.getMessages();} , 2000);
			}
		}
	},

	gotMessages : function(xmlStream, callBackParams)
	{
		var messages = dojo.fromJson(xmlStream);
		
		//If the stream is not valid, display a popup
		if (!xmlStream){
			this.errorOnHttpRequest();
			return;
		}
		
		//Compare the current message List with the new List
		var tmpArrMessages = [];
		var tmpArrMenuListItems = [];
		if(messages.length>0){
			for (var i=0; i < messages.length; i++) {		
				tmpArrMessages.push(messages[i]);
				tmpArrMenuListItems.push({intIndex: i, strPrimaryContent: messages[i].callerName =="" ? messages[i].callerId : messages[i].callerName, strSecondaryContent: messages[i].date, strPrimaryIcon: "myAVST-voicemail-"+messages[i].newMessage, strSecondaryIcon: "myAVST-voicemail-"+messages[i].newMessage, messageDetails: messages[i]});
			}
		}

		//If different, Update
		var currentList = this.data.arrMessages;
		if( this.compareMessageList(currentList, tmpArrMessages) )
		{

		}
		else
		{
			//Remove old message	
			this.data.arrMessages.splice(0, this.data.arrMessages.length);
			this.data.arrMenuListItems.splice(0, this.data.arrMenuListItems.length);
			
			//Populate the MenuItems and Messages lists
			if(messages.length>0){
				for (var i=0; i < messages.length; i++) {		
					this.data.arrMessages = tmpArrMessages;
					this.data.arrMenuListItems = tmpArrMenuListItems;
				}
			}


			//Update menuList Items
			this.setMainMenuItems(this.data.arrMenuListItems);

			//Update previewMenuList Items
			this.setPreviewMenuItems(this.data.arrMenuListItems);
			
			//Update Notification Bar
			this.setNotification( this.getUnReadVoiceMailCount() );
		}


		//Refresh MainMenu after x seconds
		this.setReLoadMainMenuItems();
	},


	forwardMessage : function (forwardExtension)
	{
		if(this.data && this.data.avstUrl && this.data.currentMessage ){
			var subscriber = this.data.avstSubscriber || "";
			var password = this.data.avstPassword || "";
			var avstServer = this.data.avstServer || "";
			var message = encodeURIComponent(this.data.currentMessage.Message);
			var url = this.data.avstUrl + "/AVST/VoiceMail/" + avstServer + "/User/" + subscriber + "/" + password + "/Messages/" + message + "/Forward/" + forwardExtension;
			this.httpRequest({
				url: url,
				method:"get",
				responseType:"text",
				timeout : 5000,
				callback: this.forwardedMessage,
				callbackError : this.errorOnHttpRequest,
				context:this
			});
		}
	},

	forwardedMessage : function(xmlStream, callBackParams)
	{
		//Refresh MainMenu after x seconds
		this.setReLoadMainMenuItems();
	},



	deleteMessage : function ()
	{
		if(this.data && this.data.avstUrl && this.data.currentMessage ){
			var subscriber = this.data.avstSubscriber || "";
			var password = this.data.avstPassword || "";
			var avstServer = this.data.avstServer || "";
			var message = encodeURIComponent(this.data.currentMessage.Message);
			var url = this.data.avstUrl + "/AVST/VoiceMail/" + avstServer + "/User/" + subscriber + "/" + password + "/Messages/" + message + "/Update/Deleted/1";
			
			this.httpRequest({
				url: url,
				method:"post",
				responseType:"text",
				timeout : 5000,
				callback: this.deletedMessage,
				callbackError : this.errorOnHttpRequest,
				context:this
			});
		}
	},

	deletedMessage : function(xmlStream, callBackParams)
	{
		//Refresh MainMenu after x seconds
		this.getMessages();
	},


	updateReadMessage : function (status)
	{
		if(this.data && this.data.avstUrl){
			var subscriber = this.data.avstSubscriber || "";
			var password = this.data.avstPassword || "";
			var avstServer = this.data.avstServer || "";
			var message = encodeURIComponent(this.data.currentMessage.Message);
			var url = this.data.avstUrl + "/AVST/VoiceMail/" + avstServer + "/User/" + subscriber + "/" + password + "/Messages/" + message + "/Update/Read/" + status;
			
			this.httpRequest({
				url: url,
				method:"get",
				responseType:"text",
				timeout : 5000,
				callback: this.updatedReadMessage,
				callbackError : this.errorOnHttpRequest,
				context:this
			});
		}
	},

	updatedReadMessage : function(xmlStream, callBackParams)
	{
		//Refresh MainMenu after x seconds
		this.setReLoadMainMenuItems();
	},




	refreshMenu : function ()
	{
		if(this.mainContainer != null) 
			{ 
				this.mainContainer.getMenu().refresh({autoCollapse : true}); 
			}
	},

	refreshMessageDetails : function(objMessage)
	{ //Reload 2/3 Part with the corresponding informations
		if(this.mainWidget != null && objMessage != null) 
			{
				this.mainWidget.reloadContainer();
			}
	},


	
//***************************************************************************************//
//Callbacks
//***************************************************************************************//
	onMessageClicked : function(intIndex)
	{
		if(intIndex)
		{
			this.intMessageListSelected = intIndex;
		}
	},
	
	menuListClicked : function(intIndex)
	{
		//Get the Message informations (new?, callerId, callerName, date and lenght)
		this.menuListSelectedIndex = intIndex;

		if(this.menuList) {
			var objMessage = this.menuList.getCurrentSelectedItem().messageDetails;
			//var objMessage = this.menuList.arrItems[intIndex].messageDetails;
			
			this.data.currentMessage = objMessage;
			this.data.messageContainerTitle = objMessage.date;

			//Update 2/3 part with the new informations
			this.refreshMessageDetails(objMessage);
			this.updateAppBar();
		}
		else
		{

		}

	},


	previewMenuClicked : function(intIndex)
	{
		this.data.indexPreview = intIndex;
		// the element can be selected only if the view is loaded
		if(!this.previewMenuClickHandler){
		this.previewMenuClickHandler = dojo.subscribe("iframe.show", dojo.hitch(this, this.selectCurrentFromPreviewMenu));
		}
	},

	selectCurrentFromPreviewMenu:function(currentIframeId)
	{
		// test if it’s the good frame
		if(currentIframeId == "webapp.myAVST.getView"){
		// select the item
			this.menuList.selectItemByIndex(this.data.indexPreview, true);
		}
	},



	//Notification Bar
	//When  Clicked on the topBar Notification
	onNotifyNewVoiceMail: function (){
		ICTouchAPI.transitionServices.getScreen({name: "webapp.myAVST.getView", params: {} });
	},
	
//***************************************************************************************//
	

	//Create the Application Button
	createApplicationButtons : function ()
	{
		var arrButtons = [];
		arrButtons.push({
			strButtonName: this.data.CALLBACK, // name of the button
			strButtonLabel: _("Call Back", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-callback', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionCallback}
		});
		arrButtons.push({
			strButtonName: this.data.PLAYVM, // name of the button
			strButtonLabel: _("Play", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-playVM', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionPlayVM}
		});
		arrButtons.push({
			strButtonName: this.data.FORWARDTO, // name of the button
			strButtonLabel: _("Forward Msg", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-forwardTo', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionForwardTo}
		});
		arrButtons.push({
			strButtonName: this.data.DELETE, // name of the button
			strButtonLabel: _("Delete", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-delete', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionDelete}
		});
		arrButtons.push({
			strButtonName: this.data.REFRESH, // name of the button
			strButtonLabel: _("Refresh", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-refresh', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionRefresh}
		});
		arrButtons.push({
			strButtonName: this.data.REWIND, // name of the button
			strButtonLabel: _("Reward", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-rewindMedia', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionRewindMedia}
		});
		arrButtons.push({
			strButtonName: this.data.PLAY, // name of the button
			strButtonLabel: _("Play", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-playMedia', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionPlayMedia}
		});
		arrButtons.push({
			strButtonName: this.data.PAUSE, // name of the button
			strButtonLabel: _("Pause", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-pauseMedia', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionPauseMedia}
		});
		arrButtons.push({
			strButtonName: this.data.STOP, // name of the button
			strButtonLabel: _("Stop", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-stopMedia', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionStopMedia}
		});
		arrButtons.push({
			strButtonName: this.data.FORWARD, // name of the button
			strButtonLabel: _("Forward", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-forwardMedia', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionForwardMedia}
		});
		// Add buttons to appbar
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView");
		appBar.removeAllActionButtons();

		for (var i in arrButtons) {
			var objButton = new UIElements.AppButton.AppButtonControl(arrButtons[i]);
			appBar.addActionButton(objButton);
		}

		// update appbar to show or hide buttons
		this.updateAppBar();
	},

	hideAllButtons : function ()
	{
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
		if(appBar.getAllButtons().length) 
		{
			appBar.getButton(this.data.CALLBACK).hide();
			appBar.getButton(this.data.PLAYVM).hide();
			appBar.getButton(this.data.FORWARDTO).hide();
			appBar.getButton(this.data.DELETE).hide();
			appBar.getButton(this.data.REFRESH).hide();

			appBar.getButton(this.data.REWIND).hide();
			appBar.getButton(this.data.PLAY).hide();
			appBar.getButton(this.data.PAUSE).hide();
			appBar.getButton(this.data.STOP).hide();
			appBar.getButton(this.data.FORWARD).hide();
		}
	},

	showMediaButtons : function ()
	{
		//Hide all buttons
		this.hideAllButtons();

		//Show all media buttons
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
		if(appBar.getAllButtons().length) 
		{
			appBar.getButton(this.data.REWIND).show();
			appBar.getButton(this.data.PLAY).show();
			appBar.getButton(this.data.PAUSE).show();
			appBar.getButton(this.data.STOP).show();
			appBar.getButton(this.data.FORWARD).show();
		}
	},

	showVoiceMailButtons : function ()
	{
		//Hide all buttons
		this.hideAllButtons();

		//Show all VoiceMail buttons
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
		if(appBar.getAllButtons().length) 
		{
			appBar.getButton(this.data.CALLBACK).show();
			appBar.getButton(this.data.PLAYVM).show();
			appBar.getButton(this.data.FORWARDTO).show();
			appBar.getButton(this.data.DELETE).show();
			appBar.getButton(this.data.REFRESH).show();
		}
	},
	
	showRefreshButton : function ()
	{
		//Hide all buttons
		this.hideAllButtons();

		//Show all VoiceMail buttons
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
		if(appBar.getAllButtons().length) 
		{
			appBar.getButton(this.data.REFRESH).show();
		}
	},

	//Create Only the Refresh Button
	createRefreshButtonOnly : function ()
	{
		var arrButtons = [];
		arrButtons.push({
			strButtonName: this.data.REFRESH, // name of the button
			strButtonLabel: _("Refresh", "webapp.myAVST"), // label of the button
			strButtonIcon: 'myAVST-refresh', // icon of the button
			strStatusText:'',
			strStatusIcon:'',
			callback: {context:this, func:this.actionRefresh}
		});

		// Add buttons to appbar
		var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView");
		appBar.removeAllActionButtons();

		for (var i in arrButtons) {
			var objButton = new UIElements.AppButton.AppButtonControl(arrButtons[i]);
			appBar.addActionButton(objButton);
		}
	},

	updateAppBar: function (status)
	{
		currentStatus = status || 0;

		switch(currentStatus)
		{
			case this.data.NO_VOICEMAIL:
				this.showRefreshButton();
				break;
			case this.data.PAUSE_STATUS:
				this.showMediaButtons();

				var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
				if(appBar.getAllButtons().length) 
				{
					appBar.getButton(this.data.PAUSE).hide();
				}
				break;
			case this.data.PLAY_STATUS:
				this.showMediaButtons();

				var appBar = ICTouchAPI.AppBarServices.getAppBar("myAVST", "getView" );
				if(appBar.getAllButtons().length) 
				{
					appBar.getButton(this.data.PLAY).hide();
				}
				break;
			case this.data.ERROR_STATUS:
				break;
			default: //0 or STOP_STATUS
				this.showVoiceMailButtons();
				break;
		}
	},
	
	actionRefresh: function ()
	{
		this.getMessages();
	},

	actionForwardTo: function ()
	{
		if(this.data.currentMessage)
		{
			var t=this;

			//Request Forward number  -> show KeyBoard
			ICTouchAPI.keyboardServices.deployKeyboard(ICTouchAPI.KeyboardTypes.NUM, null,{
				strDefaultText: "",
				showAddcontactButton: false,
				showVoicemailButton: false,
				funcCallbackOk: function(forwardExtension) {t.actionForwardToNumberEnteredCallBack(forwardExtension); }
			});
		}
	},

	actionForwardToNumberEnteredCallBack: function(forwardExtension)
	{
		console.warn("Forward extension : " + forwardExtension);

		//Request WebService to Forward the VoiceMail
		if(this.data.currentMessage)
		{
			this.forwardMessage(forwardExtension);
		}
	},

	actionPlayVM: function ()
	{
		//Show Media Buttons
		this.updateAppBar(this.data.PLAY_STATUS);
		
		//Play VoiceMail
		this.actionPlayMedia();
	},

	actionCallback: function ()
	{
		if(this.data.currentMessage && this.data.currentMessage.callerId)
		{
			//Generate a call
			ICTouchAPI.APIServices.Telephony.startPhoneCall(
				{	
					params:[this.data.currentMessage.callerId, false, true, false], 
					context:this 
				});
		}
	},

	actionDelete: function ()
	{
		if(this.data.currentMessage)
		{
			this.deleteMessage();
		}
	},
	
	actionStopMedia: function ()
	{
		var mediaFile = this.data.currentMessage.attachment;
		if(mediaFile)
		{
			this.updateAppBar(this.data.STOP_STATUS);
			ICTouchAPI.APIServices.IctMPInterface.stopMP({
				params: [1],
				context: this
			});
		}
	},

	actionPlayMedia: function ()
	{
		var mediaFile = this.data.currentMessage.attachment;
		if(mediaFile)
		{
			this.updateAppBar(this.data.PLAY_STATUS);

			ICTouchAPI.APIServices.IctMPInterface.launchMP({
				params: [1,mediaFile,data.intAreaX+281,data.intAreaY+105,data.intAreaWidth ,data.intAreaHeight,-1,false,0],
				context: this
			});

			/*
			ICTouchAPI.APIServices.IctMPInterface.playMedia({
				params: [1,mediaFile],
				context: this,
			});
			*/
		}
	},

	actionPauseMedia: function ()
	{
		var mediaFile = this.data.currentMessage.attachment;
		if(mediaFile)
		{
			this.updateAppBar(this.data.PAUSE_STATUS);
			
			ICTouchAPI.APIServices.IctMPInterface.playPauseMP({
				params: [1],
				context: this
			});
		}
	},

	actionRewindMedia: function ()
	{
		var mediaFile = this.data.currentMessage.attachment;
		if(mediaFile)
		{
			this.updateAppBar(this.data.PLAY_STATUS);
			
			ICTouchAPI.APIServices.IctMPInterface.rewindMP({
				params: [1],
				context: this
			});
		}
	},



	
	//If user change the state
	readStateChanged: function(value)
	{
		var state = (value == 0) ? "Saved" : "New";
		var status = (value == 0) ? 1 : 0;

		if(this.menuList.arrItems.length >0 && this.menuListSelectedIndex < this.menuList.arrItems.length)
		{
			//var menu =  this.mainContainer.getMenu().getContent();
			if(this.menuList)
			{
				var selectedItem = this.menuList.getCurrentSelectedItem();
				if(selectedItem)
				{
					selectedItem.messageDetails.newMessage = state;
					selectedItem.strPrimaryIcon= "myAVST-voicemail-"+ state;
					this.menuList.updateItem(selectedItem);
					this.updateReadMessage(status);
				}
			}

		}

		//Refresh Notification
		this.setNotification( this.getUnReadVoiceMailCount() );

		//Send HTTP Update request

	},

//***************************************************************************************//
//  SET and GET
//***************************************************************************************//
	setNotification: function(value)
	{
		if(value >=0)
		{
			ICTouchAPI.notificationServices.setNotificationValue("New_AVST_VoiceMail", value);
			value == 0 ? ICTouchAPI.ledServices.desactivate('event', 'ON') : ICTouchAPI.ledServices.activate('event', 'ON') ;
		}
	},
		

	getVoiceMailCount : function()
	{
		if(this.menuList)
		{
			return this.menuList.arrItems.length;
		}
		return 0;
	},

	getUnReadVoiceMailCount : function()
	{
		if(this.menuList)
		{
			var menuItems = this.menuList.arrItems;
			if(menuItems.length > 0 )
			{
				var count = 0;
				for(var i=0; i<menuItems.length; i++)
				{
					if(menuItems[i] && menuItems[i].messageDetails && menuItems[i].messageDetails.newMessage == "New")
					{
						count++;
					}
				}
				return count;
			}
		}
		return 0;
	},

	setMainContainer : function(container)
	{ 
		this.mainContainer = container;	
	},

	setMainMenu : function(menu)
	{
		this.menuList = menu;	
	},

	setPreviewContainer : function(container)
	{ 
		this.previewContainer = container;	
	},

	setPreviewMenu : function(previewmenu)
	{
		this.previewMenuList = previewmenu;	
	},


	
	setMessageContainerTitle: function(title)
	{
		webapp.myAVST.data.messageContainerTitle = title; 
	},
	
	getMessageContainerTitle: function ()
	{ 
		return webapp.myAVST.data.messageContainerTitle; 
	},


	clearMainMenu: function()
	{
		// Clear menuList
		if(this.menuList)
		{
			if (this.menuList.arrItems.length > 0)
			{
				this.menuList.deselect();
				this.menuList.emptyItems();
				
				if (this.menuList.arrItems.length >0)
				{
					this.menuList.arrItems.splice(0, this.menuList.arrItems.length);					
				}
			}
			
		}

	},

	setMainMenuItems: function (items)
	{
		//Update menuList Items
		if(this.menuList && items)
		{
			// Clear menuList
			this.clearMainMenu();

			//Add new Items
			this.menuList.insertItems(0,items);
			
			//If menuList contains items, select first
			if(items.length > 0 )
			{
				this.menuList.selectItemByIndex(0,true,false);
			}
		}
	},
	
	addMainMenuItems: function(position, items)
	{
		if(this.menuList && items && position>=0)
		{
			//Add new Items
			this.menuList.insertItems(position,items);
		}
	},

	setReLoadMainMenuItems: function()
	{
		//Setup a refresh every X minutes
		var t=this;

		if(this.data)
		{
			if(this.data.getMessagesTimeout != null){
				clearTimeout(this.data.getMessagesTimeout);
			}
			this.data.getMessagesTimeout = setTimeout(function () {t.getMessages();} , t.data.avstRefreshTimer *1000 || 60000);
		}
		else
		{
			setTimeout(function () {t.getMessages();} , t.data.avstRefreshTimer *1000 || 60000);
		}
	},

	clearPreviewMenu: function()
	{
		// Clear previewMenuList
		if(this.previewMenuList)
		{
			if (this.previewMenuList.arrItems.length > 0)
			{
				this.previewMenuList.deselect();
				this.previewMenuList.emptyItems();
				
				if (this.previewMenuList.arrItems.length >0)
				{
					this.previewMenuList.arrItems.splice(0, this.previewMenuList.arrItems.length);					
				}
			}
			
		}

	},
	
	setPreviewMenuItems: function (items)
	{
		//Update menuList Items
		if(this.previewMenuList && items)
		{
			// Clear menuList
			this.clearPreviewMenu();

			//Add new Items
			this.previewMenuList.insertItems(0,items);
		}
	},

	getMessageCssImage : function(strNewMessage)
	{
		if(strNewMessage)
		{	//strNewMessage = new/old
			return "avst-message-"+strNewMessage+".png";
		}
	},

	getMessageCssImageUrl : function(strNewMessage)
	{
		//strNewMessage = new/old
		if(strNewMessage)
		{
			return "/webapp/avst2/themes/Default/images/avst-message-"+strNewMessage+".png";
		}
	},



//***************************************************************************************//
	notifyPlayerLoading : function(objEvent) {
        // TODO
    },

	notifyPlayerError : function(objEvent) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Error, objEvent:" + objEvent.value.toString());
		//this.updateAppBar(data.ERROR_STATUS);
		objEvent	= null;
	},

	notifyPlayerPlaying : function(objEvent, objEvent2) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Playing, objEvent:" + objEvent.value.toString());
		console.log("Player Status: Playing, objEvent2:" + objEvent2.value.toString());
		//this.updateAppBar(data.PLAY_STATUS);
		objEvent	= null;
		
	},

	notifyPlayerPaused : function(objEvent, objEvent2) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Paused, objEvent:" + objEvent.value.toString());
		console.log("Player Status: Paused, objEvent2:" + objEvent2.value.toString());
		//this.updateAppBar(data.PAUSE_STATUS);
		objEvent	= null;
	},

	notifyPlayerStopped : function(objEvent) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Stopped, objEvent:" + objEvent.value.toString());

		//this.updateAppBar(data.STOP_STATUS);
		objEvent	= null;
	},

	notifyPlayerFinished : function(objEvent) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Finished, objEvent:" + objEvent.value.toString());

		//this.updateAppBar(data.STOP_STATUS);
		objEvent	= null;
	},

	notifyMediaSessionInfosReceived : function(args) {
		var data	= webapp.myAVST.data;
		console.log("Player Status: Finished, args:" + args.toString());

		//this.updateAppBar(data.STOP_STATUS);
		objEvent	= null;
	},

	notifyPlayerState : function(intDevice, boolDistant, intIndex, intState, intTotalTime, doubleVolume) {
		console.log("Player Status: STATE, intState:" + intState.value.toString());
	},


//***************************************************************************************//
//HTTPRequest
//***************************************************************************************//
	httpRequest: function(args) {
			var url = args.url;
			//Add "http://" at begin if not present
			if (url.search("^http://")==-1 && url.search("^https://")==-1) {
					url = "http://"+url;
			}
			//Rewrite URL to use internal proxy
			if (url.search("^http://")!=-1) {
					url = url.replace(new RegExp("^http://"), "http://"+location.hostname+"/ext/");
			}
			else if (url.search("^https://")!=-1) {
					url = url.replace(new RegExp("^https://"), "http://"+location.hostname+"/exts/");
			}

			var xhrArgs = {
				url: url,
				timeout: args.timeout || 0,
				handleAs: args.responseType || "text",
				headers: args.headers,
				content : args.content,
				callbackParams : args.callbackParams,
				// call the defined callback function on result received
				load: function () {
					//console.log("context", args.context, args.callback, arguments, args.timeout);
					return args.callback && args.callback.apply(args.context, arguments);

				},
				// call the defined callbackError function on timeout
				error: function () {
					//console.log("Err: context", args.context, args.callbackError, arguments, args.timeout);
					return args.callbackError && args.callbackError.apply(args.context, arguments);
				}
			};

			if (args.method == "get") {
				return dojo.xhrGet(xhrArgs);
			} else if (args.method == "post") {
				return dojo.xhrPost(xhrArgs);
			} else {
				return false;
			}
	},
	
	errorOnHttpRequest : function(error){
		var context = this;
		var buttons = [];
		// Create OK button to display in the popup
		buttons.push({
			strButtonLabel:	_("Close","webapp.avst2"),
			callback: function () {
				// When click on OK, the popup must be removed
				ICTouchAPI.popupServices.removePopup(context.objServerPopup);
				context.objServerPopup = null;
			}
		});
		// Create the content of the popup
		var popupData = {
			strTitle: _("Error","webapp.avst2"),
			strType: "error",
			strContent: _("HTTP Server Unreachable","webapp.avst2"),
			arrPopupButtons: buttons
		};
		// Create and open the popup if not already displayed
		if (!this.objServerPopup){
			this.objServerPopup = ICTouchAPI.popupServices.addNewPopup(popupData, "MEDIUM");
		}
	},
	
	//Error Popup
	avstNotFoundPopup : function (){
		var context = this;
		var buttons = [];
		// Create OK button to display in the popup
		buttons.push({
			strButtonLabel:	"OK",
			callback: function () {
				// When click on OK, the popup must be removed
				ICTouchAPI.popupServices.removePopup(context.objPopup);
			}
		});
		// Create the content of the popup
		var popupData = {
			strTitle: _("Warning","webapp.weather"),
			strType: "info",
			strContent: _("No AVST server found","webapp.weather"),
			arrPopupButtons: buttons
		};
		// Create and open the popup
		this.objPopup = ICTouchAPI.popupServices.addNewPopup(popupData, "MEDIUM");
	},

	subscriberNotFoundPopup : function (){
		var context = this;
		var buttons = [];
		// Create OK button to display in the popup
		buttons.push({
			strButtonLabel:	"OK",
			callback: function () {
				// When click on OK, the popup must be removed
				ICTouchAPI.popupServices.removePopup(context.objPopup);
			}
		});
		// Create the content of the popup
		var popupData = {
			strTitle: _("Warning","webapp.weather"),
			strType: "info",
			strContent: _("VoiceMail Box not found on AVST server","webapp.weather"),
			arrPopupButtons: buttons
		};
		// Create and open the popup
		this.objPopup = ICTouchAPI.popupServices.addNewPopup(popupData, "MEDIUM");
	},

	errorPasswordPopup : function (){
		var context = this;
		var buttons = [];
		// Create OK button to display in the popup
		buttons.push({
			strButtonLabel:	"OK",
			callback: function () {
				// When click on OK, the popup must be removed
				ICTouchAPI.popupServices.removePopup(context.objPopup);
			}
		});
		// Create the content of the popup
		var popupData = {
			strTitle: _("Warning","webapp.weather"),
			strType: "info",
			strContent: _("Incorrect password","webapp.weather"),
			arrPopupButtons: buttons
		};
		// Create and open the popup
		this.objPopup = ICTouchAPI.popupServices.addNewPopup(popupData, "MEDIUM");
	},
//***************************************************************************************//


	compareMessageList: function(a, b) {
		var test = 0;

	    if (a && b)
	    {
	    	if( ("length" in a) && ("length" in b))
	    	{
	    		if(a.length == b.length)
	    		{
	    			for(var i=0; i<a.length; i++)
	    			{
	    				if( ("Message" in a[i]) && ("Message" in b[i]))
	    				{
	    					if(a[i].Message == b[i].Message)
	    					{
	    						test = 1;
	    					}
	    					else
	    					{
	    						return 0;
	    					}
	    				}
	    				else
	    				{ 
	    					return 0;
	    				}
	    			}
	    		}
	    	}
	    }

	    return test;
	},

	padLeft:function(nr, n, str){ 
		return Array(n-String(nr).length+1).join(str||'0')+nr;
	},


//***************************************************************************************//




//***************************************************************************************//
//SETTINGS
//***************************************************************************************//
	updateAllSettings: function ()
	{
		ICTouchAPI.settingServices.getSetting("myAVSTUrl", this,this.getAVSTUrl);
		ICTouchAPI.settingServices.getSetting("myAVSTServerIP", this,this.getAVSTServerIP);
		ICTouchAPI.settingServices.getSetting("myAVSTVoiceMail", this,this.getAVSTVoiceMail);
		ICTouchAPI.settingServices.getSetting("myAVSTSubscriber", this,this.getAVSTSubscriber);
		ICTouchAPI.settingServices.getSetting("myAVSTPassword", this,this.getAVSTPassword);
		ICTouchAPI.settingServices.getSetting("myAVSTMaxMessageCount", this,this.getAVSTMaxMessageCount);
		ICTouchAPI.settingServices.getSetting("myAVSTRefreshTimer", this,this.getAVSTRefreshTimer);
		ICTouchAPI.settingServices.getSetting("myAVSTEnablePreview", this,this.getAVSTEnablePreview);
		
		
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTUrl", this.onAVSTUrlChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTServerIP", this.onAVSTServerIPChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTVoiceMail", this.onAVSTVoiceMailChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTSubscriber", this.onAVSTSubscriberChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTPassword", this.onAVSTPasswordChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTMaxMessageCount", this.onAVSTMaxMessageCountChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTRefreshTimer", this.onAVSTRefreshTimerChanged);
		ICTouchAPI.settingServices.subscribeToSetting(this, "myAVSTEnablePreview", this.onAVSTEnablePreviewChanged);
	},
	
	//On Setting changed
	onAVSTUrlChanged : function(objAVSTUrl){ if (objAVSTUrl) { this.data.avstUrl = objAVSTUrl.jsValue; }	},
	onAVSTServerIPChanged: function(objAVSTServerIP){ if(objAVSTServerIP){ this.data.avstServer = objAVSTServerIP.jsValue; } 	},
	onAVSTVoiceMailChanged: function(objAVSTVoiceMail){if(objAVSTVoiceMail){	this.data.avstDirectory = objAVSTVoiceMail.jsValue;	}	},
	onAVSTSubscriberChanged: function(objAVSTSubscriber){	if(objAVSTSubscriber){	this.data.avstSubscriber = objAVSTSubscriber.jsValue;}	},
	onAVSTPasswordChanged: function(objAVSTPassword){	if(objAVSTPassword){ this.data.avstPassword = objAVSTPassword.jsValue;	}	},
	onAVSTMaxMessageCountChanged: function(objAVSTMaxMessageCount){if(objAVSTMaxMessageCount){this.data.avstMaxMessageCount = objAVSTMaxMessageCount.jsValue;} },
	onAVSTRefreshTimerChanged: function(objAVSTRefreshTimer){	if(objAVSTRefreshTimer){this.data.avstRefreshTimer = objAVSTRefreshTimer.jsValue;} },
	onAVSTEnablePreviewChanged: function(objAVSTEnablePreview) {	this.registerHomePageContainer(objAVSTEnablePreview); },

	//Get setting
	getAVSTUrl: function(objAVSTUrl){ if(objAVSTUrl){ this.data.avstUrl = objAVSTUrl.jsValue; }	},
	getAVSTServerIP: function(objAVSTServerIP){ if(objAVSTServerIP){ this.data.avstServer = objAVSTServerIP.jsValue; }	},
	getAVSTVoiceMail: function(objAVSTVoiceMail){if(objAVSTVoiceMail){	this.data.avstDirectory = objAVSTVoiceMail.jsValue;	}	},
	getAVSTSubscriber: function(objAVSTSubscriber){	if(objAVSTSubscriber){	this.data.avstSubscriber = objAVSTSubscriber.jsValue;}	},
	getAVSTPassword: function(objAVSTPassword){	if(objAVSTPassword){ this.data.avstPassword = objAVSTPassword.jsValue;	}	},
	getAVSTMaxMessageCount: function(objAVSTMaxMessageCount){if(objAVSTMaxMessageCount){this.data.avstMaxMessageCount = objAVSTMaxMessageCount.jsValue;	}},
	getAVSTRefreshTimer: function(objAVSTRefreshTimer){	if(objAVSTRefreshTimer){this.data.avstRefreshTimer = objAVSTRefreshTimer.jsValue;} },
	getAVSTEnablePreview: function(objAVSTEnablePreview){	this.registerHomePageContainer(objAVSTEnablePreview); },
//***************************************************************************************//


	registerHomePageContainer : function(objSetting)
	{
		if (objSetting){
			if(this.data && this.data.avstEnablePreview)
			{
				this.data.avstEnablePreview = objSetting.jsValue;
			}
			
			if(objSetting.jsValue === true)
			{
				// if EnableTodoPreview=true, enable the preview
				ICTouchAPI.tools.registerHomepageContainer(["webapp.myAVST.getMessagePreview", this]);
			}
			else
			{
				// else, disable the preview
				ICTouchAPI.tools.unregisterHomepageContainer(["webapp.myAVST.getMessagePreview"]);
			}
		}
	},

	setHomepageContainer : function (strWebapp, div) {
		webapp.myAVST.previewContainer = new webapp.myAVST.getMessagePreview({ }, div);
		//this.previewContainer = new webapp.myAVST.getMessagePreview({ }, div);
	}

});
