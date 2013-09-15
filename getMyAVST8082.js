dojo.require("webapp.myAVST.getMyAVSTBase");
dojo.provide("webapp.myAVST.getMyAVST");
dojo.declare("webapp.myAVST.getMyAVST",
	webapp.myAVST.getMyAVSTBase,
	{
		templatePath:dojo.moduleUrl("webapp.myAVST","templates/getMyAVST8082.html"),

        /*
		postCreate:function(){
			new UIElements.ContainerTitle.ContainerTitleControl({
				strLabel:_("Content","webapp.myAVST")
			},this.domTitle);
		}
		*/
	}
);
