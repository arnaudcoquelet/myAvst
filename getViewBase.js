dojo.provide("webapp.myAVST.getViewBase");
dojo.declare("webapp.myAVST.getViewBase",[ICTouchAPI.webWidget,dojox.dtl._Templated],{

	postMixInProperties: function()
	{
		
	},

	startup: function()
	{
		this.updateMenuListMenu();
	},

	postCreate: function()
	{
		var data=webapp.myAVST.data;

		this.webapp.mainWidget = this;
		
		var objMenu = {
					name   : "UIElements.MenuList.MenuListControl",
					params : {
						arrItems : this.webapp.data.getMenuListItems(),
						autoSelectFirst : true,
						autoCollapse : true,
						callback: dojo.hitch(this.webapp, this.webapp.menuListClicked),
						funcCollapsed : dojo.hitch(this.webapp, this.webapp.menuListCollapsed)
					}
			};
		
		
		
		var mainContainer = new UIElements.ApplicationMode.ThirdControl({
			objMenu : objMenu,
				
			objMenuTitle : {
					strLabel: _("AVST Voice Mail", "webapp.myAVST"),
				},

			objContainer: {
						name: "UIElements.PresentationList.PresentationListControl",
						params: { 
							arrItems: [],
							boolScroll: true,
							boolShowIcon: false,
							boolShowLabel: true,
						},
			},
			objContainerTitle: {
					strLabel: _("AVST","webapp.myAVST"),
			}
		},this.domView);


		this.webapp.setMainContainer(mainContainer);
		this.menu = this.webapp.mainContainer.getMenu();
		this.webapp.setMainMenu(this.menu.getContent());
		this.container = this.webapp.mainContainer.getContainer();
		
		this.webapp.createApplicationButtons();
		this.webapp.updateAppBar(data.NO_VOICEMAIL);
		
		//Update menuList Items
		if(this.webapp.data.arrMenuListItems)
		{
			this.webapp.setMainMenuItems(this.webapp.data.arrMenuListItems);
		}
		
		
		var func=dojo.hitch(webapp.myAVST,webapp.myAVST.buttonCallback);
		var buttonBack=new UIElements.AppButton.AppButtonControl({
			strButtonName:data.BACK,strButtonLabel:_("Home","webapp.myAVST"),strButtonIcon:"generic-homepage",callback:func});

		ICTouchAPI.AppBarServices.addStaticButton("myAVST","getView",buttonBack);
	},


	updateMenuListMenu : function(){
			this.menu.reload({
				objMenu : {
					name   : "UIElements.MenuList.MenuListControl",
					params : {
						arrItems : this.webapp.data.getMenuListItems(),
						autoSelectFirst : true,
						autoCollapse : true,
						callback: dojo.hitch(this.webapp, this.webapp.menuListClicked),
						funcCollapsed : dojo.hitch(this.webapp, this.webapp.menuListCollapsed)
					}
				},
				objMenuTitle : {
					strLabel : _("AVST Voice Mail", "webapp.myAVST"),
				}
			});
	},
	
	/**
	 * Reload the 2/3 part
	 * -objParams : new elements to display
	 */
	reloadContainer : function() {
			
		if(this.container){
			//Get MessagesDetails
			var displayItems = [];
			
			if(this.webapp.data.currentMessage != null) 
			{
				//Caller ID
				displayItems.push({strLabel: _("callerID", "webapp.myAVST"), strContent: this.webapp.data.currentMessage.callerId});
				
				//Caller Name
				displayItems.push({strLabel: _("callerName", "webapp.myAVST"), strContent: this.webapp.data.currentMessage.callerName});
				
				//Length
				displayItems.push({strLabel: _("length", "webapp.myAVST"), strContent: this.webapp.data.currentMessage.length.toString()});	

				//Blank
				displayItems.push({strLabel: "",strContent:""});

				//Read/UnRead
				var state = this.webapp.data.currentMessage.newMessage == "New" ? 1 : 0;
				displayItems.push( {
					strLabel: _("State", "webapp.myAVST"),
					objContent :  new UIElements.OptionChooser.OptionChooserControl({
						arrItems : [_("Read","webapp.myAVST"), _("UnRead","webapp.myAVST")],
						funcCallback : dojo.hitch(this.webapp, this.webapp.readStateChanged), 
						intIndex: state,
						boolShowTouch: false,
						intOptionWidth: 130,
					}) } );						
			}
			
			//Create a Presentation List
			/*
			this.container.reload({
				objTitle: { 
					strLabel : this.webapp.data.messageContainerTitle,
					},
				objContent: {
						name : "UIElements.PresentationList.PresentationListControl",
						params : {
							arrItems: displayItems,
							boolScroll : true,
							boolShowIcon: true,
							boolShowLabel: true,
						}
					}

			});
			*/

			this.container.reload({
				objTitle: { 
					strLabel : this.webapp.data.messageContainerTitle,
					},
				objContent: {
						name : "webapp.myAVST.getMessageDetails",
						params : []
					}

			});

			this.webapp.createApplicationButtons();
		}
			
	},

});
