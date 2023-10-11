import {Singleton} from "../../base/BUtils";
import {BAction, BConditional, BConditionalType, BNodeStatus} from "../../base/BNode";

export class Man extends Singleton{
    hp:number = 100;
    mp:number = 100;
}
export class ActionAttack extends BAction{
    async update(): Promise<BNodeStatus> {
        const old = Man.getInstance<Man>().mp
        const now = Man.getInstance<Man>().mp -= 10;
        console.log(`受到攻击，血量从${old}降为${now}`)
        return BNodeStatus.SUCCESS;
    }
}
export class ActionSkill extends BAction{
    startTime:number;
    constructor(public name:string,public use:number,public duration:number) {
        super()
    }

    async start() {
        await super.start();
        this.startTime = Date.now()
        console.log("技能释放前摇")
    }
    async update(): Promise<BNodeStatus> {
        if (Date.now() - this.startTime > this.duration){
            const old = Man.getInstance<Man>().hp
            Man.getInstance<Man>().hp -= this.use;
            const now = Man.getInstance<Man>().hp
            console.log(`释放技能${this.name}，蓝条从${old}降为${now}`)
            return BNodeStatus.SUCCESS;
        }
        return BNodeStatus.RUNNING
    }
}
export class ConditionalMpSafe extends BConditional{
    constructor(public number:number) {
        super();
    }
    async update(): Promise<BNodeStatus> {
        const now = Man.getInstance<Man>().mp
        const flag = now >  this.number
        console.log(`判定，目前血量${now}`+(flag?"":"不")+"满足条件")
        return flag?BNodeStatus.SUCCESS:BNodeStatus.FAILURE;
    }
}
export class ConditionalHPRight extends BConditional{
    type: BConditionalType = BConditionalType.INNER;
    constructor(public number:number) {
        super();
    }
    async update(): Promise<BNodeStatus> {
        const now = Man.getInstance<Man>().hp
        const flag = now > this.number
        console.log(`判定，目前蓝条${now}`+(flag?"":"不")+"满足条件")
        return flag?BNodeStatus.SUCCESS:BNodeStatus.FAILURE;
    }
}
export class ActionRecovery extends BAction{
    async update(): Promise<BNodeStatus> {
        Man.getInstance<Man>().mp += 20;
        console.log(`吃到食物，增加20滴血，目前血量${Man.getInstance<Man>().mp}`)
        return await super.update();
    }
}
export class ActionSleep extends BAction{
    duration:number;
    startTime:number;
    constructor(duration:number) {
        super();this.duration = duration;
    }

   async start() {
        await   super.start();
        this.startTime = Date.now()
    }

    async update(): Promise<BNodeStatus> {
        console.log("休息中")
        if (Date.now() - this.startTime > this.duration){
            console.log("休息结束")
            return BNodeStatus.SUCCESS
        }
        return BNodeStatus.RUNNING
    }
}