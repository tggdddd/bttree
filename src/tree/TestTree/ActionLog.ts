import {BAction, BNodeStatus} from "../../base/BNode";

export class ActionLog extends BAction{
    msg:string;
    constructor(msg:string) {
        super();
        this.msg = msg
    }
    async update(): Promise<BNodeStatus> {
        await super.update();
        console.log(this.msg)
        return BNodeStatus.SUCCESS
    }
}
