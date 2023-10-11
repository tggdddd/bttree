import BUtils, {Singleton} from "./BUtils";
import BTree, {BNode, BNodeStatus} from "./BNode";

class NodePaint {
    public static width = 30;    // px
    public static height = 30;    // px
    private static nodes: Map<string, NodePaint> = new Map();
    public status: BNodeStatus = BNodeStatus.INACTIVE

    constructor(public key: string, public uid: string, public nodeName: string = "", public left: number = 0, public top: number = 0) {
        NodePaint.nodes.set(key + uid, this)
    }

    static getNode(key: string, uid: string) {
        return NodePaint.nodes.get(key + uid);
    }

    static addNode(key: string, uid: string, nodeName: string = "", left: number = 0, top: number = 0) {
        NodePaint.nodes.set(key + uid, new NodePaint(key, uid, nodeName, left, top));
    }

    static paint(context2D: CanvasRenderingContext2D, key: string, uid: string) {
        const node = NodePaint.getNode(key, uid);
        context2D.globalCompositeOperation = "source-over"
        if (node != null) {
            switch (node.status) {
                case BNodeStatus.INACTIVE:
                    context2D.fillStyle = "#54504e";
                    break;
                case BNodeStatus.RUNNING:
                    context2D.fillStyle = "#dcbf4f";
                    break;
                case BNodeStatus.SUCCESS:
                    context2D.fillStyle = "#5ac948";
                    break;
                case BNodeStatus.FAILURE:
                    context2D.fillStyle = "#cc2578";
                    break;
            }
            context2D.beginPath();
            context2D.arc(node.left + NodePaint.width / 2, node.top + NodePaint.height, NodePaint.width / 2, 0, Math.PI * 2);
            context2D.fillStyle = "#fff"
            const textMetrics = context2D.measureText(uid);
            const textLeft = Math.max((NodePaint.width - textMetrics.width) / 2, 0);
            context2D.fillText(uid, node.left + textLeft, node.top + (NodePaint.height) / 2, NodePaint.width)
        }
    }

    static lineTo(context2D: CanvasRenderingContext2D, key: string, uid1: string, uid2: string) {
        const node1 = NodePaint.getNode(key, uid1);
        const node2 = NodePaint.getNode(key, uid2);
        context2D.globalCompositeOperation = "destination-over"
        context2D.strokeStyle = "#000";
        context2D.beginPath();
        context2D.moveTo(node1.left + NodePaint.width / 2, node1.top + NodePaint.height / 2);
        context2D.lineTo(node2.left + NodePaint.width / 2, node2.top + NodePaint.height / 2);
        context2D.stroke();
    }
}

export class BNodeDebug extends Singleton {
    private canvans: Map<string, HTMLCanvasElement> = new Map();
     vGap: number = 10;
     hGap: number = 10;

    constructor() {
        super();
    }

    public paintNode(key: string, uid: string, left: number, top: number, nodeName: string) {
        let htmlCanvasElement = this.canvans.get(key);
        NodePaint.addNode(key, uid, nodeName, left, top);
        NodePaint.paint(this.canvans.get(key).getContext("2d"), key, uid);
    }

    public updateStatus(uid: string, status: BNodeStatus) {

    }

    public renderTree(tree: BTree) {
        const key = tree.key
        let maxHeight = 0;
        let maxWidth = 0;
        const levelUid: any = {}
        let temp: any = [tree.root.uid]
        while (temp.length) {
            const temp2 = []
            for (let ui of temp) {
                while (ui != null) {
                    const aaa = (levelUid[maxHeight] || [])
                    aaa.push(ui)
                    levelUid[maxHeight] = aaa
                    maxWidth = Math.max(maxWidth, aaa.length)
                    const childUid = BUtils.childFirstUID(ui)
                    const nodeByUid = BUtils.getNodeByUid(childUid, key);
                    if (nodeByUid != null) {
                        temp2.push(childUid);
                    }
                    if (null != BUtils.getNextNodeByUid(ui, key)) {
                        ui = BUtils.nextUID(ui);
                    } else {
                        ui = null;
                    }
                }
            }
            maxHeight++;
            temp = temp2;
        }
        let canvasJS = $("<canvas></canvas>")
            .attr("width", $("html").width())
            .attr("height", maxWidth * (this.vGap + NodePaint.height))
            .attr("id", key);
        $("body").append(canvasJS);
        const canvas = canvasJS.get(0) as HTMLCanvasElement;
        this.canvans.set(key, canvas);
        const context = canvas.getContext("2d")
        const widthMap = new Map();
        for (let i = 0; i < maxHeight; i++) {
            let uids = levelUid[i]
            for (let j = 0; j < uids.length; j++) {
                let uid = uids[j];
                const NodeWidth = NodePaint.width;
                const NodeHeight = NodePaint.height;
                // const totalWidth = maxWidth * NodeWidth;
                // const blockWidth = (1 / uids.length) * totalWidth
                // const blockLeft = (j / uids.length) * totalWidth;
                // const left = blockLeft + (blockWidth - NodePaint.width) / 2
                const totalWidth = $("html").width();
                const left = BNodeDebug.getSeparate(widthMap, uid, key) * totalWidth - NodePaint.width / 2
                const top = i * NodeHeight
                this.paintNode(key, uid, left, top, BUtils.getNodeByUid(uid, key).constructor.name);
            }
        }
        BNodeDebug.reduceLine(context, tree.root);

    }

    private static getWidth(widthMap: Map<string, number>, uid: string, key: string) {
        let parentUid = BUtils.parentUID(uid);
        if (parentUid == null) {
            return 1;
        }
        let width = widthMap.get(parentUid);
        if (width == null) {
            let node = BUtils.getNodeByUid(uid, key);
            let nextNode = node;
            while (nextNode != null) {
                node = nextNode
                nextNode = nextNode.nextNode()
            }
            const {level, index} = BUtils.getCurUIDInfo(node.uid);
            widthMap.set(parentUid, index + 1);
            width = index + 1;
        }
        return width;
    }

    private static getSeparate(widthMap: Map<string, number>, uid: string, key: string) {
        let superWidth = 1;
        let left = 0;
        let pos = 4;
        while (pos <= uid.length) {
            const id = uid.substring(0, pos)
            const width = this.getWidth(widthMap, id, key);
            const {index} = BUtils.getCurUIDInfo(id);
            let blockWidth = superWidth / width
            let innerLeft = blockWidth * index
            left += innerLeft
            superWidth = blockWidth
            pos += 4
            console.log("blockWidth", blockWidth, "innerLeft", innerLeft, "width", width, "index", index)
        }
        console.log(`left`, left, "width", superWidth, left + superWidth / 2)
        return left + superWidth / 2;
    }

    private static reduceLine(context: CanvasRenderingContext2D, node: BNode) {
        if (node != null) {
            let childFirstUID = BUtils.childFirstUID(node.uid);
            while (true) {
                let nodeByUid = BUtils.getNodeByUid(childFirstUID, node.key);
                if (nodeByUid == null) {
                    break;
                }
                NodePaint.lineTo(context, node.key, node.uid, childFirstUID);
                BNodeDebug.reduceLine(context, nodeByUid);
                childFirstUID = BUtils.nextUID(childFirstUID);
            }
        }
    }
}