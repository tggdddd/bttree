import {BCompositeRandom, BConditional, BNode, BNodeStatus} from "./BNode";

export function extendOf(instance: any, parent: any): boolean {
    while (instance) {
        if (instance.constructor.name == parent.name) {
            return true;
        }
        instance = instance.__proto__;
    }
    return false;
}

export default class BUtils {
    static map: any = {};
    static shuffleMap: any = {};//用来保存random后的交换 仅为CompositeRandom使用
    static executeNodeMap: Map<string,Set<BNode>> = new Map();
    static conditionMap: Map<string,Set<BConditional>> = new Map();//保存打断类型的条件节点

    static getSameParentUid(uid1: string, uid2: string): string {
        let i = 0;
        while (uid1.substring(i, i + 4) == uid2.substring(i, i + 4)) {
            i += 4;
        }
        return uid1.substring(0, i);
    }

    static shuffleSort(arr:Array<any>) {
        let n = arr.length;
        while (n) {
            const index = Math.floor(Math.random() * n--);
            const temp = arr[index];
            arr[index] = arr[n];
            arr[n] = temp;
        }
    }
    static shuffle(parentNode: BCompositeRandom) {
        let length = parentNode.children.length;
        const key = parentNode.key
        const temp:any = new Array(length);
        for (let i =0;i<length;i++){
            temp[i] = i;
        }
        BUtils.shuffleSort(temp);
        for (let i = 0; i < length; i++) {
            BUtils.shuffleMap[parentNode.key][parentNode.children[i].uid] = parentNode.children[temp[i]]
        }
    }

    static getNextNodeByUid(uid: string, key: string): BNode | null {
        return BUtils.map[key][BUtils.nextUID(uid)]
    }

    static getNodeByUid(uid: string, key: string): BNode {
        return BUtils.map[key][uid]
    }

    static getParentNodeByUid(uid: string, key: string): BNode | null {
        return BUtils.map[key][uid.substring(0, uid.length - 4)];
    }

    static hasNextNode(node: BNode) {
        return BUtils.getNextNode(node) != null;
    }

    static getNextNode(node: BNode) {
        return BUtils.getNextNodeByUid(node.uid, node.key);
    }

    static addNode(node: BNode, uid: string, key: string) {
        BUtils.map[key][uid] = node;
        node.uid = uid;
        node.key = key;
    }

    /**
     * 获取UID后的UID
     * @param uid
     */
    static nextUID(uid: string | null): string {
        if (uid) {
            const cur = this.getCurUIDInfo(uid)
            return uid.substring(0, uid.length - 4) + this.n2s(cur.level) + this.n2s(cur.index + 1)
        }
        return "0000"
    }
    static parentUID(uid:string):string{
        return uid.substring(0,uid.length-4);
    }
    /**
     * 获取UID下一层的首个UID
     * @param uid
     */
    static childFirstUID(uid: string): string {
        const cur = this.getCurUIDInfo(uid)
        return uid + this.n2s(cur.level + 1) + this.n2s(0)
    }

    /**
     * 获取uid的当前信息
     * @param uid
     */
    static getCurUIDInfo(uid: string): { level: number, index: number } {
        const a = uid.substring(uid.length - 4)
        return {
            level: parseInt(a.substring(0, 2)),
            index: parseInt(a.substring(2))
        }
    }

    /**
     * 获取uid的上一层信息
     * @param uid
     */
    static getParentUIDInfo(uid: string): { level: number, index: number } | null {
        if (uid.length == 4) {
            return null;
        }
        const a = uid.substring(-8, -4)
        return {
            level: parseInt(a.substring(0, 2)),
            index: parseInt(a.substring(2))
        }
    }

    /**
     * 将数字转为2位数16进制字符串
     * @param val
     * @private
     */
    private static n2s(val: number): string {
        let r = val.toString(16)
        if (r.length < 2) {
            r = "0" + r
        }
        return r;
    }

}


export class Singleton {
    private static _instance: any = null;
    static getInstance<T>(): T {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }
}