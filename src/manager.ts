import {TestTree} from "./tree/TestTree";
import BTree from "./base/BNode";
import {BNodeDebug} from "./base/nodeDebug";
import {Singleton} from "./base/BUtils";

export class Manager extends Singleton {
    trees:Array<BTree> = []
    debug: boolean = false
    constructor() {
        super()
        this.trees.push(new TestTree("test"))
        this._init()
    }

    async run() {
        if (Manager.getInstance<Manager>().debug && BNodeDebug.pause) {
            return
        }
        for (const tree of this.trees) {
            await tree.run().then()
        }
    }

    private _init(){
        if (this.debug){
            const nodeDebug = BNodeDebug.getInstance<BNodeDebug>()
            for (const tree of this.trees) {
                nodeDebug.renderTree(tree);
            }
        }
    }
}

(async function loop() {
    await Manager.getInstance<Manager>().run()
    requestAnimationFrame(loop)
})()