dojo.provide("webapp.myAVST.getMessagePreviewBase");
dojo.declare("webapp.myAVST.getMessagePreviewBase",[ICTouchAPI.webWidget,dojox.dtl._Templated],{
	
	domMessagePreview: null,

	postCreate : function() {
		// setPreviewContainer sets variable previewContainer (defautlt value null)
		this.webapp.setPreviewContainer(new UIElements.Container.ContainerControl(
												{
												// title of the preview
												objTitle: { strLabel : "AVST Voice Mail"},
												// content of the preview : a menuList
												objContent: {
																name : "UIElements.MenuList.MenuListControl",
																params  : {
																			boolHighlightSelected : false,
																			autoSelectFirst : false,
																			arrItems : [],
																			callback : dojo.hitch(this, this.openSelected)
																		}
																}
												},
												this.domMessagePreview)
										);

		this.webapp.setPreviewMenu(this.webapp.previewContainer.getContent()); //set variable previewMenuList of controlBase
	},

	openSelected : function(intIndex){
		// open the webapp
		ICTouchAPI.transitionServices.getScreen({name: "webapp.myAVST.getView",params: {} });
		
		//Reload MainView
		this.webapp.setMainMenuItems(this.webapp.data.arrMenuListItems);

		// and select the element
		this.webapp.previewMenuClicked(intIndex);
	},

	destroy : function(){
		if(this.webapp.previewContainer) { this.webapp.previewContainer.destroy(); }
		this.inherited(arguments);
	},

	previewClicked:function()
	{
		ICTouchAPI.transitionServices.getScreen({name: "webapp.myAVST.getView", params: {} });
	},

});