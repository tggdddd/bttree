import {BAction, BNodeStatus} from "../../base/BNode";

export class ActionFailure extends BAction{
    async update(): Promise<BNodeStatus> {
        await super.update();
        return BNodeStatus.FAILURE;
    }
}