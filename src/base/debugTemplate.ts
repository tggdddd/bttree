export const template =
    `
<input hidden="hidden" id="box"/>
<div style="position: fixed;right: 10px;bottom: 10px;border-radius: 12px;width: 60px;height: 60px;display: flex;
align-items: center;justify-content: center;color: #00000055;background: #b095ee;box-shadow: inset 1px 1px white,inset -1px -1px 1px #666666;">
    调试
</div>
<div style="width: 420px;height: 60px;padding:0 12px;position:fixed;right: 10px;bottom: 10px;border-radius: 12px;display: flex;
align-items: center;justify-content: space-between;color: #00000055;background: #bfa5f6;box-shadow: inset 1px 1px white,inset -1px -1px 1px #666666;
">
<style>
    #stop:checked~#switch-label{
        filter: opacity(.5);
    }
    #stop:checked~#switch-label::before{
        content: "恢复";
    }
    #stop~#switch-label::before{
        content: "暂停";
         width: 60px;
        position:absolute;
        height: 32px;
        text-align:center;
        line-height:32px;
        left: 0;
        top: 0;
        color:white;
    }
</style>
<input hidden="hidden" id="stop" type="checkbox"  onchange="const custom = new Event('ce:pause');custom.value = this.checked;document.dispatchEvent(custom)"/>
<label id="switch-label" style="width: 60px;position:relative;height: 32px;text-align:center;line-height:32px;
text-shadow:1px 1px 8px #51b1dc;color:white;border-radius: 12px;background: #7a7ad3;box-shadow: inset -1px -1px 7px white,inset 1px 1px #666666" for="stop"></label>
<label for="delay" style="color: white;">减速</label>
<input id="delay" type="range" value="0" min="0" max="5000" onchange="document.querySelector('#delayValue').innerText = this.value+'ms';const custom = new Event('ce:delay');custom.value = this.value;document.dispatchEvent(custom)"/>
<div id="delayValue" style="color: white">0ms</div>
</div>

`
export default {template}