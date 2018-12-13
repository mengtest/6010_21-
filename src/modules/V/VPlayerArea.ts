namespace point21 {
    export class VPlayerArea {
        public _view: fui.room.FUI_playerArea;
        private _view_banker: fui.room.FUI_playerArea_banker;
        private seatId: number;                          //本地固定从左向右的座位编号（1~5）
        private recoverCard_endNode: fairygui.GObject;      //回收牌时的move结束节点
        private deal_startNode: fairygui.GObject;           //发牌的开始位置
        private recoverDuration: number = 300;            //回收牌动作时间
        private roomView: fui.room.FUI_roomView;         //房间视图
        public canClick:boolean;                           //下注区域是否可点击

        protected requestGS(...params: Array<any>): void { bx.Framework.notify(bx.GConst.n_gs_send, ...params); }
        constructor(v: fui.room.FUI_playerArea | fui.room.FUI_playerArea_banker, i: number) {
            if (i === 0) {
                this._view_banker = v as fui.room.FUI_playerArea_banker;
            } else {
                this._view = v as fui.room.FUI_playerArea;
            }
            this.seatId = i;
        }

        init(roomView: fui.room.FUI_roomView): void {
            this.roomView = roomView;
            //this.recoverCard_endNode = roomView.m_recoverNode;
            this.deal_startNode = roomView.m_card1;
        }

        reset(): void {
            if (this._view) {
                this.setPoint(0, 0);
                this.setPoint(0, 1);
                this.setPoint(0, 2);
                this.removeChildrenFromList(0);
                this.removeChildrenFromList(1);
                this.removeChildrenFromList(2);
                this._view.m_fen.selectedIndex = 0;

                this.removeChildrenFromChipList(0);
                this.removeChildrenFromChipList(1);
                this.removeChildrenFromChipList(2);
                this.setChip(0,0);
                this.setChip(0,1);
                this.setChip(0,2);

                this.setTipsToBetVisible(false);
                this.setCardTypeTipVisible(false,0);
                this.setCardTypeTipVisible(false,1);
                this.setCardTypeTipVisible(false,2);
                
                this.doubleSignVisible(false,0);
                this.doubleSignVisible(false,1);
                this.doubleSignVisible(false,2);
                this.insuranceSignVisible(false);

            } else {
                this.setPoint(0);
                this.removeChildrenFromList();
                this.setCardTypeTipVisible(false);
            }
        }

        /////////////////以下为两种类型 公共部分///////////////

        //设置点数(左 中 右 庄)
        setPoint(point: number | string, id?: number): void {
            let str: string = point.toString();
            if(point > 21) str = bx.GData.getLanguage('201314');
            if (point === 0) {
                if (this._view) {
                    this._view['m_point' + id].visible = false;
                } else {
                    this._view_banker.m_cardPoint.visible = false;
                }
                return;
            }else {
                if (this._view) {
                    this._view['m_point' + id].visible = true;
                    this._view['m_point' + id].m_value.text = str;
                } else {
                    this._view_banker.m_cardPoint.visible = true;
                    this._view_banker.m_cardPoint.m_value.text = str;
                }
            }
        }

        //移除牌列表item(左 中 右  庄)
        removeChildrenFromList(id?: number): void {
            if (this._view) {
                this._view['m_cardsList' + id].m_list1.removeChildrenToPool();
                this._view['m_cardsList' + id].m_list2.removeChildrenToPool();
            } else {
                this._view_banker.m_cardList.removeChildrenToPool();
            }
        }

        //牌列表添加子元素(闲家需要指定上下列表序号)
        addChildToList(id?: number, index?: number): fairygui.GObject {
            let child: fairygui.GObject;
            let list: fairygui.GList;
            if (this._view) {
                list = this._view['m_cardsList' + id]['m_list' + index];
            } else {
                list = this._view_banker.m_cardList;
            }
            child = list.addItemFromPool();
            //立刻重排，以便获取正确位置
            list.ensureBoundsCorrect();
            return child;
        }

        //发牌
        dealCard(endNode:fui.room.FUI_card,data:protos.dealCardsList,type:number):void{
            let _this = this;
            let card: fui.room.FUI_card = Laya.Pool.getItemByCreateFun('card', function () {
                return fui.room.FUI_card.createInstance();
            })
            card.m_card.url = 'ui://room/bg';
            this.roomView.addChild(card);
            let deal: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
            deal.target = card;
            deal.start = this.deal_startNode;
            deal.end = endNode;
            deal.duration = 300;
            deal.props = { scaleX: [deal.start.scaleX,deal.end.scaleX], scaleY: [deal.start.scaleY,deal.end.scaleY] };
            deal.complete = function(){
                card.removeFromParent();
                Laya.Pool.recover('card',this.target);
                Laya.Pool.recover('move',deal);
                this.end.visible = true;
                this.end.m_card.url = 'ui://room/bg';
                _this.dealComplete(this.end,data,type);
            }
            deal.move();
            SoundManager.instance.playSound(AssetsUtils.getSoundUrl('deal'));
        }

        //收牌
        recoverCards(): void {
            if (this._view) {
                if (this._view.m_fen.selectedIndex === 0) {
                    this.recoverCardsList(this._view.m_cardsList0.m_list2, 0);
                    this.recoverCardsList(this._view.m_cardsList0.m_list1, 0);
                    //一定要在回收列表执行之后再清空列表
                    this.removeChildrenFromList(0);
                } else {
                    this.recoverCardsList(this._view.m_cardsList1.m_list2, 1);
                    this.recoverCardsList(this._view.m_cardsList1.m_list1, 1);
                    this.recoverCardsList(this._view.m_cardsList2.m_list2, 2);
                    this.recoverCardsList(this._view.m_cardsList2.m_list1, 2);
                    this.removeChildrenFromList(1);
                    this.removeChildrenFromList(2);
                }
            } else {
                this.recoverCardsList(this._view_banker.m_cardList);
                this.removeChildrenFromList();
            }
        }

        //循环某个牌列表 收回列表中所有的牌 动作
        recoverCardsList(list: fairygui.GList, id?: number): void {
            for (let i = 0; i < list.numChildren; i++) {
                let card: fui.room.FUI_card = Laya.Pool.getItemByCreateFun('card', function () {
                    return fui.room.FUI_card.createInstance();
                })
                this.roomView.addChild(card);
                let recover: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
                recover.target = card;
                recover.start = list.getChildAt(i);
                recover.end = this.recoverCard_endNode;
                recover.duration = 500;
                //recover.duration = this.recoverDuration;
                recover.props = {skewX:[this._view.skewX,this.recoverCard_endNode.skewX],skewY:[this._view.skewY,this.recoverCard_endNode.skewY]};
                recover.complete = function () {
                    Laya.Pool.recover('card', this.target);
                    (this.target as fairygui.GObject).removeFromParent();
                    Laya.Pool.recover('recoverMove', this);
                }
                recover.move();
            }
        }

        //发牌完成后
        dealComplete(target:fui.room.FUI_card,data:protos.dealCardsList,type:number): void {
            let cardImg :string;
            let cardInfo:number;
            if(type == 0){
                cardInfo = data.cards[0];
                this.renderCardType(data);
            }else if(type == 1){
                cardInfo = data.cards[0];
            }else if(type == 2){
                cardInfo = data.cards[1];
                this.renderCardType(data);
            }
            cardImg = Utils.getCardImg(cardInfo);
            let cardWidth:number = target.width;
            if(cardInfo === 0){
                target.m_card.url = cardImg;
            }else{
                target.m_trun.setHook('change', Laya.Handler.create(this, function () {
                    target.m_card.url = cardImg;
                }))
                target.m_trun.play();
                Laya.timer.once(500,this,function(){
                    target.m_card.url = cardImg;
                    target.skewY = 0;
                    target.width = cardWidth;
                })
            }
        }

        //牌型和点数设置
        setCardAndPoint(type,playSound:boolean,whichOne,min,max):void{
            if(type == 3){//五小龙
                playSound && SoundManager.instance.playSound(AssetsUtils.getSoundUrl('blackjack'));
                this.setCardTypeTipVisible(true,whichOne,1);
                this.setPoint(0,whichOne);
            }else if(type == 4){//黑杰克
                playSound && SoundManager.instance.playSound(AssetsUtils.getSoundUrl('blackjack'));
                this.setCardTypeTipVisible(true,whichOne,2);
                this.setPoint(0,whichOne);
            }else if(type == 0){//爆牌
                playSound && SoundManager.instance.playSound(AssetsUtils.getSoundUrl('boom'));
                this.setCardTypeTipVisible(true,whichOne,0);
                this.setPoint(22,whichOne);
            }else if(type == 1 || type == 2){//其他点数
                if(min == max){
                    this.setPoint(min,whichOne);
                }else{
                    this.setPoint( min + '/' + max,whichOne);
                }
            }
        }

        //庄家暗牌翻牌
        turnBankerCard(card:Array<number>):void{
            let cardImg:string = Utils.getCardImg(card[0]);
            let type = card[1];
            let min = card[2];
            let max = card[3];
            this.setCardAndPoint(type,true,0,min,max);
            let target:fui.room.FUI_card = this._view_banker.m_cardList.getChildAt(1) as fui.room.FUI_card;
            target.m_trun.setHook('change', Laya.Handler.create(this,function(){
                target.m_card.url = cardImg;
            }))
            target.m_trun.play();
        }

        //渲染牌型相关
        renderCardType(data:protos.dealCardsList):void{
            let type = data.cardType;
            if(type == 3 || type == 4 || type == 0){
                bx.Framework.notify(point21.GConst.n_hideBtns);
            }
            this.setCardAndPoint(type,true,data.whichOne,data.minSum,data.maxSum);
        }

        //牌型提示 显示/隐藏    type 0:爆牌  1：五小龙 2:黑杰克
        setCardTypeTipVisible(state: boolean,id: number = 0, type?: number): void {
            let target:fui.room.FUI_cardType;
            if(this._view){
                target = this._view['m_cardType' + id];
            }else{
                target = this._view_banker.m_cardType;
            }
            target.m_typeChoose.selectedIndex = 0;//隐藏静态图
            if(state){
                let sk1,sk2;
                if(type == 1){
                    sk1 = this.getSK('sk_dragon1','wuxiaolong1.sk');
                    sk2 = this.getSK('sk_dragon2','wuxiaolong2.sk');
                }else if(type == 2){
                    sk1 = this.getSK('sk_bj1','heijieke1.sk');
                    sk2 = this.getSK('sk_bj2','heijieke2.sk');
                }else if(type == 0){
                    sk1 = this.getSK('boom','baopai.sk');
                }
                target.displayObject.addChild(sk1.sk);
                sk1.sk.x = target.width / 2;
                sk1.sk.y = target.height / 2;
                sk1.play('animation',false);
                if(sk2){
                    target.displayObject.addChild(sk2.sk);
                    sk2.sk.x = target.width / 2;
                    sk2.sk.y = target.height / 2;
                    sk2.play('animation',false);
                }

                Laya.timer.once(300,this,function(){
                    target.m_typeChoose.selectedIndex = type;
                })
            }
        }

        //由对象池取得牌型的骨骼动画
        getSK(sign:string,name:string):bx.Skeleton{
            let sk:bx.Skeleton = Laya.Pool.getItemByCreateFun('sk',function(){
                return new bx.Skeleton(name);
            })
            sk.completeHandle = Laya.Handler.create(this,function(){
                sk.sk.removeSelf();
                Laya.Pool.recover(sign,sk);
            })
            return sk;
        }

        //////////////////////以下为 闲家 特有部分//////////////////////////////////
        //修改筹码值
        setChip(n: number,id:number = 0): void {
            if(!this._view) return;
            let str = n.toString();
            if (n == 0) {
                str = '';
            }
            this._view['m_chipCount' + id].m_value.text = str;
        }

        //筹码列表移除子元素（左 中 右）
        removeChildrenFromChipList(id: number): void {
            this._view['m_chipsList' + id].removeChildrenToPool();
        }

        //筹码列表添加子元素（左 中 右）
        addChildToChipList(id: number, value: number): fui.room.FUI_chip {
            let url = Utils.getChipImg(value);
            var chip: fui.room.FUI_chip;
            chip = this._view['m_chipsList' + id].addItemFromPool();
            chip.m_img.url = url;
            this._view['m_chipsList' + id].ensureBoundsCorrect();
            return chip;
        }

        //设置筹码列表旋转角度（初始化时三个都要设置一次）
        setChipListRotation(rotation: number) {
            if (!this._view) return;
            this._view.m_chipsList0.rotation = rotation;
            this._view.m_chipsList1.rotation = rotation;
            this._view.m_chipsList2.rotation = rotation;
            this._view.m_clickToBet.rotation = rotation;
        }

        //设置筹码列表倾斜值
        // setChipListSkew(x:number,y:number):void{
        //     if(!this._view) return;
        //     this._view.m_chipsList0.setSkew(x,y);
        //     this._view.m_chipsList1.setSkew(x,y);
        //     this._view.m_chipsList2.setSkew(x,y);
        //     this._view.m_clickToBet.setSkew(x,y);
        // }

        //是否在此区域下注 的显示/隐藏
        setTipsToBetVisible(state: boolean): void {
            if(this._view){
                this._view.m_clickToBet.visible = state;
                this._view.m_chipArea.m_selectedCtl.selectedIndex = state ? 1 : 0;
                this.canClick = state;
            }
        }


        //分牌
        divideCard(card1: number, card2: number): void {
            if(!this._view) return;
            this._view.m_fen.selectedIndex = 1;
            this.addChildToList(1, 1).visible = false;
            this.addChildToList(2, 1).visible = false;
            let cardInfo: Array<number> = [card1, card2];

            let card: fui.room.FUI_card;
            for(let i = 0; i < 2; i++) {
                card = Laya.Pool.getItemByCreateFun('card', function () {
                    return fui.room.FUI_card.createInstance();
                })
                card.m_card.url = Utils.getCardImg(cardInfo[i]);
                card.setScale(0.8,0.8);
                this._view.addChild(card);
                let divideMove: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
                divideMove.target = card;
                divideMove.start = this._view.m_centerCard_hide;
                divideMove.end = this._view['m_cardsList' + (i + 1)].m_list1.getChildAt(0);
                //divideMove.duration = this.recoverDuration;
                divideMove.duration = 300;
                divideMove.complete = function () {
                    this.target.removeFromParent();
                    Laya.Pool.recover('card', this.target);
                    Laya.Pool.recover('move',divideMove);
                    this.end.visible = true;
                    let url = Utils.getCardImg(cardInfo[i]);
                    (this.end as fui.room.FUI_card).m_card.url = url;
                }
                divideMove.move();
            }
        }

        //轮到某玩家的标志控制
        // ActivedMarkVisible(state:boolean,id:number = 0):void{
        //     if(!this._view) return;
        //     this._view.m_activeCtl.selectedIndex = state ? 1 : 0;
        //     if(state){
        //         if(id == 0) return;
        //         if(id == 1){
        //             this.cardListMaskVisible(false,1);
        //             this.cardListMaskVisible(true,2);
        //         }else if(id == 2){
        //             this.cardListMaskVisible(true,1);
        //             this.cardListMaskVisible(false,2);
        //         }
        //     }
            
        // }

        //显示或隐藏某牌列表遮罩
        cardListMaskVisible(state:boolean,id:number):void{
            let list1:fairygui.GList = this._view['m_cardsList' + id].m_list1;
            let list2:fairygui.GList = this._view['m_cardsList' + id].m_list2;
            if(list1.numItems > 0){
                for(let i = 0; i < list1.numItems; i++){
                    (list1.getChildAt(i) as fui.room.FUI_card).m_maskCtl.selectedIndex = state ? 1 : 0;
                }
            }
            if(list2.numItems > 0){
                for(let i = 0; i < list2.numItems; i++){
                    (list2.getChildAt(i) as fui.room.FUI_card).m_maskCtl.selectedIndex = state ? 1 : 0;
                }
            }
        }

        //根据筹码值给某个筹码列表添加item,并返回所有子节点  state:子节点是否显示
        getChipListChildren(value: number, state: boolean, id: number = 0): Array<fui.room.FUI_chip> {
            let chips = Utils.getChipImgObj(value);
            let children: Array<fui.room.FUI_chip> = [];
            this.removeChildrenFromChipList(id);
            for (let item in chips) {
                for (let i = 0; i < chips[item]; i++) {
                    let child = this.addChildToChipList(id, Number(item));
                    child.visible = state;
                    children.push(child);
                }
            }
            return children;
        }

        //下注动画
        playerBet(value: number, startNodeid: number, id: number = 0): void {
            let _this = this;
            let chips = Utils.getChipImgObj(value);
            let count: number = 0;
            let children: Array<fui.room.FUI_chip> = this.getChipListChildren(value, false, id);

                Laya.timer.once(1,this,function(){
                for (let item in chips) {
                    for (let j = 0; j < chips[item]; j++) {
                        let chip: fui.room.FUI_chip = Laya.Pool.getItemByCreateFun('chip', function () {
                            return fui.room.FUI_chip.createInstance();
                        });
                        chip.m_img.url = 'ui://room/c' + item;
                        chip.visible = false;
                        this.roomView.addChild(chip);
                        let betMove: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
                        betMove.target = chip;
                        betMove.start = this.roomView['m_chip' + startNodeid];
                        betMove.end = children[children.length - 1 - count];
                        betMove.duration = this.recoverDuration;
                        betMove.complete = function () {
                            this.end.visible = true;
                            this.target.removeFromParent();
                            Laya.Pool.recover('chip', this.target);
                            Laya.Pool.recover('move', this);
                        }
                        Laya.timer.once(count * 50, this, function () {
                            betMove.target.visible = true;
                            betMove.move();
                            SoundManager.instance.playSound(AssetsUtils.getSoundUrl('bet'));
                        });
                        count++;
                    }
                }
            })
        }

        //双倍标志 显示/隐藏
        doubleSignVisible(state:boolean,id:number):void{
            this._view['m_cardsList' + id].m_lang_double.visible = state;
        }

        //保险标志 显示/隐藏
        insuranceSignVisible(state:boolean):void{
            this._view.m_careCtl.selectedIndex = state ? 1 : 0;
        }

        //收筹码
        playerBetBack(value: number, endNodeId: number, id: number): void {
            let _this = this;
            let chips = Utils.getChipImgObj(value);
            let count = 0;
            let list: fairygui.GList = this._view['m_chipsList' + id];
            for (let item in chips) {
                for (let i = 0; i < chips[item]; i++) { 
                    let chip: fui.room.FUI_chip = Laya.Pool.getItemByCreateFun('chip', function () {
                        return fui.room.FUI_chip.createInstance();
                    })
                    chip.m_img.url = 'ui://room/c' + item;
                    chip.visible = false;
                    this.roomView.addChild(chip);

                    let action: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
                    action.target = chip;
                    action.start = list.getChildAt(count);
                    action.end = this.roomView['m_chip' + endNodeId];
                    action.duration = 500;
                    action.complete = function () {
                        this.target.removeFromParent();
                        Laya.Pool.recover('chip', this.target); 
                        Laya.Pool.recover('move', action);
                        if (count >= list.numChildren - 1) {
                            _this.removeChildrenFromChipList(id);
                        }
                    }
                    Laya.timer.once(count * 50, this, function () {
                        action.target.visible = true;
                        (action.start as fairygui.GObject).visible = false;
                        action.move();
                        SoundManager.instance.playSound(AssetsUtils.getSoundUrl('bet'));
                    });
                    count++;
                }
            }
        }

        //筹码从玩家飞向庄家/从庄家飞向玩家,to~ 0:推向庄家  1：推向自己
        moveChipList(to: number, id: number): void {
            let _this = this;
            let action: Tools.Move = Laya.Pool.getItemByClass('move', Tools.Move);
            action.target = this._view['m_chipsList' + id];
            action.start = this._view['m_chipsList' + id + '_hide'];
            action.end = this.roomView.m_chipBank;
            action.duration = 500;
            action.complete = function () {
                this.target.x = this.start.x;
                this.target.y = this.start.y;
                Laya.Pool.recover('move', action);
                if (to === 0){
                    _this.removeChildrenFromChipList(id);
                }
            };
            SoundManager.instance.playSound(AssetsUtils.getSoundUrl('betBack'));
            (to == 0) ? action.move() : action.moveReverse();
        }

        //赢得筹码动画
        win(playerId:number,value: number, id: number =0): void {
            let _this = this;
            this.getChipListChildren(value, true, id);
            this.moveChipList(1, id);
            Laya.timer.once(500,this,function(){
                _this.playerBetBack(value,playerId,id);
            })
        }
    }
}