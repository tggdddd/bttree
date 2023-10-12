import BTree, {BCompositeSequence} from "../base/BNode";
import {ActionAttack, ActionSkill, ConditionalHPRight} from "./Role/Man";
import {ActionLog} from "./TestTree/ActionLog";

export class TestTree extends BTree {
    key: string = "test";

    constructor(key: string) {
        super(key, new BCompositeSequence(
                new ActionAttack(),
                // new BCompositeBatchAll(
                // new BCompositeSequence(
                //     new BRevertDecorator(new ConditionalMpSafe(60)),
                //     new ActionRecovery()
                // ),
                // new BCompositeSequence(
                //     new ConditionalHPRight(30),
                //     new ActionSkill("技能1",30, 5000)
                // ),
                // new BCompositeSequence(
                //     new ConditionalHPRight(50),
                //     new ActionSkill("技能2", 50,8000)
                // ),
                // new BCompositeSequence(
                //     new ConditionalHPRight(80),
                //     new ActionSkill("技能3",80, 2000)
                // ),
                // new BCompositeSequence(
                //     new ConditionalHPRight(10),
                //     new ActionSkill("技能4",10, 500)
                // )
                // ),

                // new ActionSleep(500),
            new ActionLog("记录1111"),

            new ActionLog("记录2222"),

            new ActionLog("记录33333"),
                new BCompositeSequence(
                    new BCompositeSequence(
                        new ConditionalHPRight(10),
                        new ActionSkill("技能4", 10, 500)
                    ),
                    new ActionSkill("技能4", 10, 500),
                    new BCompositeSequence(
                        new ConditionalHPRight(10),
                        new ActionSkill("技能4", 10, 500)
                    )
                )
            )
        )
    }
}