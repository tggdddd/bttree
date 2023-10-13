import BUtils, {extendOf} from "./BUtils";
import {BNodeDebug} from "./nodeDebug";
import {Manager} from "../manager";

export class BNode {

    public name: string;
    private _status: BNodeStatus = BNodeStatus.INACTIVE;
    get status(): BNodeStatus {
        return this._status
    }

    set status(val: BNodeStatus) {
        if (BNodeDebug.debug) {
            const debug = BNodeDebug.getInstance<BNodeDebug>();
            if (val == BNodeStatus.INACTIVE) {
                if (this._status != BNodeStatus.RUNNING) {
                    debug.updateStatus(this.uid, this.key, this.status);
                }
            } else {
                debug.updateStatus(this.uid, this.key, this.status);
            }
        }
        this._status = val
    }

    public setName(val: string) {
        this.name = val;
        return this;
    }

    uid: string = "" //标识树内节点
    key: string = ""  //标识树
    prevStatus: BNodeStatus = BNodeStatus.INACTIVE

    async start() {
        // console.info(BNode.getUidDesc(this.uid),this.constructor.name,"开始执行start")
        this.status = BNodeStatus.RUNNING
        if (!extendOf(this, BConditional)) {
            const executeNodes = BUtils.executeNodeMap.get(this.key);
            executeNodes.add(this)
        }
    }

    async update(): Promise<BNodeStatus> {

        return this.status = BNodeStatus.SUCCESS
    }

    static getText(i: any) {
        switch (i) {
            case BNodeStatus.INACTIVE:
                return "INACTIVE"
            case BNodeStatus.RUNNING:
                return "RUNNING"
            case BNodeStatus.FAILURE:
                return "FAILURE"
            case BNodeStatus.SUCCESS:
                return "SUCCESS"
        }
    }

    static getUidDesc(uid: string) {
        const curUIDInfo = BUtils.getCurUIDInfo(uid);
        return curUIDInfo.level + "-" + curUIDInfo.index
    }

    end() {
        // console.info(BNode.getUidDesc(this.uid),this.constructor.name,"开始执行end")
        this.status = BNodeStatus.INACTIVE
        BUtils.executeNodeMap.get(this.key).delete(this)
        if (extendOf(this, BConditional)) {
            // @ts-ignore
            if (this.type !== BConditionalType.NORMAL) {
                // @ts-ignore
                BUtils.conditionMap.get(this.key).add(this)
                // console.error(BUtils.conditionMap.get(this.key))
            }
        } else if (extendOf(this, BComposite)) {
            const conditionals = BUtils.conditionMap.get(this.key)
            const deletes: Array<BConditional> = []
            conditionals.forEach(value => {
                if (value.type == BConditionalType.INNER) {
                    deletes.push(value)
                }
            })
            // console.error(deletes, "122222222222222222222222222222")
            deletes.forEach(a => {
                conditionals.delete(a)
            })
        }
        // if (this.isRoot()) {
        //todo  判断是否需要清空    逻辑判定
        // BUtils.conditionMap.get(this.key).clear()
        // }
        // console.error(BUtils.conditionMap.get(this.key))
    }

    async run() {
        if (this.status == BNodeStatus.INACTIVE) {
            await this.start()
        }
        const status = await this.update()
        this.status = status
        if (status != BNodeStatus.RUNNING) {
            this.prevStatus = status
            this.end()
        }
        if (!extendOf(this, BConditional)) {
            const executeNodes = BUtils.executeNodeMap.get(this.key);
            const conditionls: Array<BConditional> = [];
            BUtils.conditionMap.get(this.key).forEach(a => conditionls.push(a))
            for (let conditional of conditionls) {
                if (await conditional.isChange()) {
                    console.error(conditional.constructor.name + "触发条件打断")
                    let parentUid = conditional.uid
                    executeNodes.forEach(executeNode => {
                        parentUid = BUtils.getSameParentUid(parentUid, executeNode.uid);
                        while (executeNode.uid != parentUid) {
                            if (executeNode.status != BNodeStatus.INACTIVE) {
                                executeNode.end()
                            }
                            executeNode = executeNode.parentNode()
                        }
                    })
                    let linkNode = conditional as BNode;
                    const arr: Array<BNode> = []
                    while (linkNode.uid != parentUid) {
                        arr.push(linkNode)
                        linkNode = linkNode.parentNode()
                    }
                    for (let i = arr.length - 1; i > 1; i--) {
                        await arr[i].start()
                        if (extendOf(arr[i], BComposite)) {
                            const compositeNode = arr[i] as BComposite
                            const childNode = arr[i - 1]
                            if (extendOf(compositeNode, BCompositeRandom)) {
                                compositeNode.runUid = BUtils.shuffleMap[compositeNode.key][childNode.uid]
                            } else {
                                compositeNode.runUid = childNode.uid
                            }
                        }
                    }
                    await arr[1].start()
                    return status
                }
            }
        }
        if (Manager.getInstance<Manager>().debug && BNodeDebug.delay) {
            await new Promise(resolve => {
                setTimeout(() => resolve(null), BNodeDebug.delay)
            })
        }
        return status
    }

    nextNode(): BNode {
        return BUtils.getNextNode(this);
    }

    hasNextNode() {
        return BUtils.hasNextNode(this);
    }

    parentNode() {
        return BUtils.getParentNodeByUid(this.uid, this.key);
    }

    hasParentNode() {
        return this.parentNode() != null;
    }

    isRoot() {
        return this.uid == "0000";
    }
}

/**标识有子节点*/
export class BParent extends BNode {
    children: Array<BNode>

    constructor(...nodes: Array<BNode>) {
        super();
        this.children = nodes;
    }
}

export class BConditional extends BNode {
    type: BConditionalType = BConditionalType.NORMAL

    constructor() {
        super();
    }

    async isChange() {
        if (this.prevStatus == BNodeStatus.INACTIVE) {
            return false;
        }
        const prevStatus = this.prevStatus
        const status = await this.run()
        console.info(`执行条件判定${this.name} 当前状态${status} 此前状态${prevStatus}`)
        return prevStatus != status
    }
}

export class BComposite extends BParent {
    runUid: string = ""
    isRandom: boolean = false

    constructor(...nodes: Array<BNode>) {
        super(...nodes);
    }

    async start() {
        await super.start();
        this.runUid = BUtils.childFirstUID(this.uid)
    }

}

export class BCompositeRandom extends BComposite {
    isRandom: boolean = true

    async start() {
        await super.start();
        BUtils.shuffle(this)
    }

    constructor(...nodes: Array<BNode>) {
        super(...nodes);
    }
}

async function selectorUpdate(node: BComposite): Promise<BNodeStatus> {
    const executeNode = node.isRandom ? BUtils.shuffleMap[node.key][node.runUid] : BUtils.getNodeByUid(node.runUid, node.key)
    const status = await executeNode.run()
    if (status == BNodeStatus.RUNNING) {
        return BNodeStatus.RUNNING
    }
    if (status == BNodeStatus.FAILURE) {
        const next = BUtils.getNextNodeByUid(node.runUid, node.key);
        if (next != null) {
            node.runUid = next.uid
            return BNodeStatus.RUNNING
        }
    }
    return status
}

async function sequenceUpdate(node: BComposite): Promise<BNodeStatus> {
    const executeNode = node.isRandom ? BUtils.shuffleMap[node.key][node.runUid] : BUtils.getNodeByUid(node.runUid, node.key)
    const status = await executeNode.run()
    if (status == BNodeStatus.RUNNING) {
        return BNodeStatus.RUNNING
    }
    if (status == BNodeStatus.SUCCESS) {
        const next = BUtils.getNextNodeByUid(node.runUid, node.key);
        if (next != null) {
            node.runUid = next.uid
            return BNodeStatus.RUNNING
        }
    }
    return status
}

export class BCompositeSelector extends BComposite {
    async update(): Promise<BNodeStatus> {
        await super.update();
        return await selectorUpdate(this)
    }
}

export class BCompositeRandomSelector extends BCompositeRandom {
    async update(): Promise<BNodeStatus> {
        await super.update();
        return await selectorUpdate(this)
    }
}

export class BCompositeRandomSequence extends BCompositeRandom {
    async update(): Promise<BNodeStatus> {
        await super.update();
        return await sequenceUpdate(this)
    }
}

export class BCompositeSequence extends BComposite {
    async update(): Promise<BNodeStatus> {
        await super.update();
        return await sequenceUpdate(this)
    }
}

export class BCompositeBatchRace extends BComposite {
    async start() {
        await super.start();
        this.runUid = this.children.map(r => r.uid).join(",")
    }

    async update(): Promise<BNodeStatus> {
        await super.update();
        const key = this.key;
        let running: Array<string> = []
        const that = this
        const runningNodes = this.runUid.split(",").map(uid => BUtils.getNodeByUid(uid, key));
        let lock = runningNodes.length
        let status = BNodeStatus.RUNNING
        for (const node of runningNodes) {
            new Promise(async (resolve, reject): Promise<{ status: BNodeStatus, node: BNode, parentNode: BNode }> => {
                if (node == null) {
                    lock--;
                    reject()
                    return
                }
                resolve({
                    status: await node.run(),
                    node: node,
                    parentNode: that
                })
            }).then((res: { status: BNodeStatus, node: BNode, parentNode: BNode }) => {
                //当有一个执行结束，返回结果 结束其他节点的执行
                if (res.status != BNodeStatus.RUNNING && status != BNodeStatus.RUNNING) {
                    status = res.status
                    running = []
                }
                // 晚于其他执行结束     自我终止
                if (status != BNodeStatus.RUNNING) {
                    node.end()
                } else {
                    running.push(res.node.uid)
                }
                lock--;
            })
        }
        while (lock) {
        }
        if (running.length != 0) {
            this.uid = running.join(",")
            return BNodeStatus.RUNNING
        }
        return status
    }
}

/**异步批量所有
 * 全部执行完返回成功
 * */
export class BCompositeAllAsync extends BComposite {
    async start() {
        await super.start();
        if (this.runUid && this.runUid.length) {
            const key = this.key
            this.runUid.split(",").forEach(uid => {
                BUtils.getNodeByUid(uid, key).end()
            })
        }
        this.runUid = this.children.map(r => r.uid).join(",")
    }

    async update(): Promise<BNodeStatus> {
        await super.update();
        const key = this.key;
        const running: Array<string> = []
        await Promise.all(this.runUid.split(",").map(runUid => {
            return new Promise(async resolve => {
                const node = BUtils.getNodeByUid(runUid, key);
                let result = null;
                if (node) {
                    result = {
                        status: await node.run(),
                        uid: runUid
                    }
                }
                return resolve(result);
            })
        })).then((rr: Array<any>) => {
            for (const r of rr) {
                let res = r as { status: BNodeStatus, uid: string }
                if (res && res.status == BNodeStatus.RUNNING) {
                    running.push(res.uid)
                }
            }
        });
        this.runUid = running.join(",")
        if (running.length != 0) {
            return BNodeStatus.RUNNING
        }
        return BNodeStatus.SUCCESS
    }
}

/**
 * 同步批量执行
 * 全部执行完返回成功
 */
export class BCompositeAll extends BComposite {
    async start() {
        await super.start();
        if (this.runUid && this.runUid.length) {
            const key = this.key
            this.runUid.split(",").forEach(uid => {
                BUtils.getNodeByUid(uid, key).end()
            })
        }
        this.runUid = this.children.map(r => r.uid).join(",")
    }

    async update(): Promise<BNodeStatus> {
        await super.update();
        const key = this.key;
        const running: Array<string> = []
        const nodes = this.runUid.split(",").map(runUid => BUtils.getNodeByUid(runUid, key)).filter(a => a != null)
        for (let node of nodes) {
            const status = await node.run()
            if (status == BNodeStatus.RUNNING) {
                running.push(node.uid)
            }
        }
        this.runUid = running.join(",")
        if (running.length != 0) {
            return BNodeStatus.RUNNING
        }
        return BNodeStatus.SUCCESS
    }
}

/**
 * 随机顺序同步批量执行
 * 全部执行完返回成功
 */
export class BCompositeRandomAll extends BCompositeRandom {
    async start() {
        await super.start();
        if (this.runUid && this.runUid.length) {
            const key = this.key
            this.runUid.split(",").forEach(uid => {
                BUtils.getNodeByUid(uid, key).end()
            })
        }
        this.runUid = this.children.map(r => r.uid).join(",")
    }

    async update(): Promise<BNodeStatus> {
        await super.update();
        const key = this.key;
        const running: Array<string> = []
        const nodes = this.runUid.split(",").map(runUid => BUtils.getNodeByUid(runUid, key)).filter(a => a != null)
        for (let node of nodes) {
            const status = await node.run()
            if (status == BNodeStatus.RUNNING) {
                running.push(node.uid)
            }
        }
        this.runUid = running.join(",")
        if (running.length != 0) {
            return BNodeStatus.RUNNING
        }
        return BNodeStatus.SUCCESS
    }
}

/**
 *
 */
export class BDecorator extends BParent {
    constructor(...nodes: Array<BNode>) {
        super(...nodes);
    }
}

export enum BNodeStatus {
    INACTIVE = "INACTIVE",
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    FAILURE = "FAILURE"
}

export enum BConditionalType {
    NORMAL,
    INNER,
    ALWAYS
}

export class BAction extends BNode {

}

export default class BTree {
    constructor(public key: string, public root: BNode) {
        this.key = key
        this.root = root
        this.init()
    }

    private init(): BTree {
        BUtils.map[this.key] = []
        BUtils.conditionMap.set(this.key, new Set<BConditional>())
        BUtils.executeNodeMap.set(this.key, new Set<BNode>())
        BUtils.shuffleMap[this.key] = []
        BUtils.addNode(this.root, BUtils.nextUID(null), this.key);
        BTree.reduceChildUid(this.root, this.key);
        return this;
    }

    async run() {
        return await this.root.run()
    }

    /**
     * 为BNode的子节点赋uid，并置入BUtils中
     * @param root
     * @param key
     */
    static reduceChildUid(root: BNode, key: string) {
        if (extendOf(root, BParent)) {
            let curUid = BUtils.childFirstUID(root.uid);
            // @ts-ignore
            for (let i of root.children) {
                BUtils.addNode(i, curUid, key);
                curUid = BUtils.nextUID(curUid);
                BTree.reduceChildUid(i, key);
            }
        }
    }
}

export class BRevertDecorator extends BDecorator {
    async update(): Promise<BNodeStatus> {
        await super.update();
        const node = this.children[0]
        const status = await node.run()
        if (status == BNodeStatus.FAILURE) {
            return BNodeStatus.SUCCESS
        } else if (status == BNodeStatus.SUCCESS) {
            return BNodeStatus.FAILURE
        }
        return status
    }
}

export class BRepeatDecorator extends BDecorator {
    total = 1;
    count = 1;

    async start() {
        await super.start();
        this.count = 1;
    }

    setTotal(number: number) {
        this.total = number
        return this;
    }

    constructor(...nodes: Array<BNode>) {
        super(...nodes);
    }

    async update(): Promise<BNodeStatus> {
        await super.update();
        const node = this.children[0]
        const status = await node.run()
        if (status == BNodeStatus.FAILURE) {
            return BNodeStatus.FAILURE
        } else if (status == BNodeStatus.SUCCESS) {
            if (this.count >= this.total) {
                return BNodeStatus.SUCCESS
            }
            this.count++;
            return BNodeStatus.RUNNING
        }
        return status
    }
}