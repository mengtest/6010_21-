/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module fui.Game {

	export class FUI_item3 extends fairygui.GButton {

		public m_button:fairygui.Controller;
		public m_n30:fairygui.GImage;
		public m_lang_name:fairygui.GLoader;
		public m_n31:fairygui.GImage;
		public m_lang_base:fairygui.GTextField;
		public m_antes3:fairygui.GTextField;
		public m_lang_zhunru:fairygui.GTextField;
		public m_lowest3:fairygui.GTextField;

		public static URL:string = "ui://8oy4o0mbmtpmi";

		public static createInstance():FUI_item3 {
			return <FUI_item3><any>(fairygui.UIPackage.createObject("Game","item3"));
		}

		public constructor() {
			super();
		}

		protected constructFromXML(xml: any): void {
			super.constructFromXML(xml);

			this.m_button = this.getControllerAt(0);
			this.m_n30 = <fairygui.GImage><any>(this.getChildAt(0));
			this.m_lang_name = <fairygui.GLoader><any>(this.getChildAt(1));
			this.m_n31 = <fairygui.GImage><any>(this.getChildAt(2));
			this.m_lang_base = <fairygui.GTextField><any>(this.getChildAt(3));
			this.m_antes3 = <fairygui.GTextField><any>(this.getChildAt(4));
			this.m_lang_zhunru = <fairygui.GTextField><any>(this.getChildAt(5));
			this.m_lowest3 = <fairygui.GTextField><any>(this.getChildAt(6));
		}
	}
}