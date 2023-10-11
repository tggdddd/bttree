import {TestTree} from "./tree/TestTree";
import BTree from "./base/BNode";
import {BNodeDebug} from "./base/nodeDebug";

class Manager {
    trees:Array<BTree> = []
    debug:boolean = true
    private _init(){
        if (this.debug){
            for (const tree of this.trees) {
                BNodeDebug.getInstance<BNodeDebug>().renderTree(tree);
            }
        }
    }
    constructor() {
        this.trees.push(new TestTree("test"))
        this._init()
    }
    run(){
        for (const tree of this.trees) {
            tree.run().then()
        }
    }
}

const manager = new Manager();
async function loop(){
    manager.run()
    requestAnimationFrame(loop)
}
// loop()