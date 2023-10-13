import {TestTree} from "./tree/TestTree";
import BTree from "./base/BNode";
import {Singleton} from "./base/BUtils";

export class Manager extends Singleton {
    trees:Array<BTree> = []
    constructor() {
        super()
        this.trees.push(new TestTree("test"))
        this._init()
    }

    async run() {
        for (const tree of this.trees) {
            await tree.run().then()
        }
    }

    private _init(){

    }
}

(async function loop() {
    await Manager.getInstance<Manager>().run()
    requestAnimationFrame(loop)
})()