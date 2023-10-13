import BUtils, {Singleton} from "./BUtils";
import BTree, {BNode, BNodeStatus} from "./BNode";
import {EChartsType, init as initEcharts} from "echarts";
import {template} from "./debugTemplate"

export class ChartData {
    value: string;
    public itemStyle: any;

    constructor(public name: string, value: string, public children: Array<ChartData> = []) {
        this.avalue = value
    }

    get avalue() {
        return this.value
    }

    set avalue(val: string) {
        this.value = val
        this.itemStyle = {
            color: this.getColor(val)
        }
    }

    getColor(status: any) {
        switch (status) {
            case BNodeStatus.FAILURE:
                return "#cc2578"
            case BNodeStatus.SUCCESS:
                return "#5ac948"
            case BNodeStatus.RUNNING:
                return "#dcbf4f"
            case BNodeStatus.INACTIVE:
                return "#999"
        }
    }
}

export class BNodeDebug extends Singleton {
    static pause = true;
    static debug = false;
    static delay: number = 0;
    static dataMap: Map<string, Map<string, ChartData>> = new Map();
    vGap: number = 10;
    hGap: number = 5;
    nodeWidth: number = 20;
    nodeHeight: number = 15;
    private charts: Map<string, EChartsType> = new Map();

    constructor() {
        super();
        BNodeDebug.debug = true;
        $("body").append(template)
        $("#stop").prop("checked", true)
        document.addEventListener("ce:delay", function (e) {
            // @ts-ignore
            BNodeDebug.setDelay(e.value)
        })
        document.addEventListener("ce:pause", function (e) {
            // @ts-ignore
            BNodeDebug.stop(e.value)
        })
    }

    static setDelay(val: number) {
        BNodeDebug.delay = val;
    }

    static stop(is: boolean = true) {
        BNodeDebug.pause = is
    }

    public updateStatus(uid: string, key: string, status: BNodeStatus) {
        BNodeDebug.dataMap.get(key).get(uid).avalue = status;
        this.flashChart(key);
    }

    getTreeData(key: string) {
        return BNodeDebug.dataMap.get(key).get(BUtils.nextUID(null));
    }

    flashChart(key: string) {
        const eChartsType = this.charts.get(key);
        eChartsType.setOption({
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [
                {
                    type: 'tree',
                    data: [this.getTreeData(key)],
                    left: '2%',
                    right: '2%',
                    top: '12%',
                    bottom: '10%',
                    initialTreeDepth: -1,
                    symbol: 'circle',
                    symbolSize: 20,
                    orient: 'vertical',
                    expandAndCollapse: true,
                    label: {
                        position: 'top',
                        verticalAlign: 'middle',
                        distance: 10,
                        align: 'center',
                        fontSize: 9,
                        formatter: `{b}\n{c}`
                    },
                    itemStyle: {
                        width: 400,
                        height: 400
                    },
                    leaves: {
                        label: {
                            position: 'bottom',
                            verticalAlign: 'middle',
                            align: 'center'
                        }
                    },
                    animationDurationUpdate: -1
                }
            ]
        });
    }

    public renderTree(tree: BTree) {
        const key = tree.key
        BNodeDebug.dataMap.set(key, new Map());
        const levelUid: any = {}
        let height = 0;

        function reduce(node: BNode): ChartData {
            height++;
            const key = node.key
            const uid = node.uid
            let name = node.name
            if (name == null) {
                name = node.constructor.name
            }
            const data = new ChartData(name, node.status);
            BNodeDebug.dataMap.get(key).set(uid, data);
            let childUid = BUtils.childFirstUID(uid);
            let childNode = BUtils.getNodeByUid(childUid, key);
            while (childNode != null) {
                let childData = reduce(childNode);
                data.children.push(childData);
                childNode = childNode.nextNode()
            }
            return data;
        }

        reduce(BUtils.getNodeByUid(BUtils.nextUID(null), key));
        let chartDom = document.createElement("div");
        chartDom.style.height = (height * (this.nodeHeight + this.vGap)) + "px";
        chartDom.style.width = "800px";
        chartDom.setAttribute("id", key);
        $("body").append(chartDom);
        const eChart = initEcharts(chartDom);
        this.charts.set(key, eChart);
        this.flashChart(key)
        $("html").on("resize", function () {
            eChart.resize()
        })
    }
}