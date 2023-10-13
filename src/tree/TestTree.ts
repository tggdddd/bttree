import BTree, {BCompositeAllAsync, BCompositeSequence} from "../base/BNode";
import {ActionRecovery, ActionSkill, ActionSleep, ConditionalHPRight} from "./Role/Man";

export class TestTree extends BTree {
    key: string = "test";


    constructor(key: string) {
        super(key, new BCompositeSequence(
            new ActionSleep(200).setName("无操作200ms"),
            new BCompositeAllAsync(
                new BCompositeSequence(
                    new ConditionalHPRight(95).setName("蓝条大于95"),
                    new ActionSkill("技能1", 30, 10000)
                ),
                    new BCompositeSequence(
                        new ConditionalHPRight(55).setName("蓝条大于95"),
                        new ActionSkill("技能1", 30, 10000)
                    ),
            ),
            new ActionSleep(20000).setName("无操作200ms"),
            new ActionRecovery(100).setName("恢复状态")
            )
        )
    }
}