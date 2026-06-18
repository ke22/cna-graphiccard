// 版型註冊表：以 id 對應版型模組，供 main.js 選用。
// 新增版型時於此註冊即可，main/renderer 不需更動。

import timeline from './timeline.js';
import headline from './headline.js';
import template3 from './template3.js';

const TEMPLATES = {
  [timeline.id]: timeline,
  [headline.id]: headline,
  [template3.id]: template3,
};

export const DEFAULT_TEMPLATE_ID = 'timeline';

/**
 * 取得指定 id 的版型模組。未知（或空）id 退回預設版型 timeline；
 * 傳入未知 id 時印出警告（不中斷渲染）。
 * @param {string} [id]
 * @returns {{id: string, columns: object, buildNodes: Function, renderNode: Function}}
 */
export function getTemplate(id) {
  if (id && TEMPLATES[id]) return TEMPLATES[id];
  if (id) {
    console.warn(`[registry] 未知版型 "${id}"，退回 ${DEFAULT_TEMPLATE_ID}`);
  }
  return TEMPLATES[DEFAULT_TEMPLATE_ID];
}
