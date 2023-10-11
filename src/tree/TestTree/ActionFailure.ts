import {BAction, BNodeStatus} from "../../base/BNode";

export class ActionFailure extends BAction{
    async update(): Promise<BNodeStatus> {
        return BNodeStatus.FAILURE;
    }
}