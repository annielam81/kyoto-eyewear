import type { PrescriptionType } from '@/models';

/**
 * 初始发售范围的**唯一来源**。
 *
 * 这里是**临时的上线限制，不是功能删除**：Progressive / Bifocal / Readers 与隐形眼镜的
 * 领域实现、ADD 规则、定价、购物车/订单结构、翻译与测试全部原样保留。
 * 日后要重新开售，只需把对应项改回 true —— 不需要重建任何实现。
 *
 * 不要在页面里另写 `if (type === 'progressive')` 之类的硬编码判断，一律读这里。
 */
export const LAUNCH_AVAILABILITY = {
  /** 处方眼镜（镜框 + 镜片）——初始版本的主营业务 */
  prescriptionEyeglasses: true,
  lensTypes: {
    single: true,          // 单光：初始版本唯一在售的镜片类型
    progressive: false,    // 渐进：实现完整保留，暂不对客户开放
    bifocal: false,        // 双光：实现完整保留，暂不对客户开放
    readers: false,        // 老花：实现完整保留，暂不对客户开放
  } as Record<PrescriptionType, boolean>,
  /** 隐形眼镜（含订阅）——初始版本不对客户开放 */
  contactLenses: false,
} as const;

/** 该镜片类型当前是否对客户开放。 */
export const isLensTypeAvailable = (t: PrescriptionType): boolean =>
  LAUNCH_AVAILABILITY.lensTypes[t] === true;

/** 当前开放的镜片类型（保持 single→progressive→bifocal→readers 的既有展示顺序）。 */
export const AVAILABLE_LENS_TYPES: PrescriptionType[] =
  (['single', 'progressive', 'bifocal', 'readers'] as PrescriptionType[]).filter(isLensTypeAvailable);

/**
 * 当前只剩一种可售镜片类型时返回它，否则返回 null。
 * 只有一种时，让客户在只有一个选项的页面上点一下没有意义 ——
 * 向导会跳过类型步并自动写入这个值（见 store 的 start() 与 flowFor()）。
 */
export const soleLensType = (): PrescriptionType | null =>
  AVAILABLE_LENS_TYPES.length === 1 ? AVAILABLE_LENS_TYPES[0] : null;

/** 隐形眼镜入口（首页订阅横幅等）当前是否对客户开放。 */
export const isContactLensAvailable = (): boolean => LAUNCH_AVAILABILITY.contactLenses;

/**
 * 发售期对**已存在**的镜片类型取值做收敛。
 *
 * 开发机上可能留有此前测试 Progressive / Bifocal / Readers 时配出来的状态：
 *  - `isEditingCartItem = true`（正在编辑既有购物车条目）→ **原样保留**。
 *    不把客户当初配的渐进片改写成单光，那会歪曲这笔配置本来的内容。
 *  - `isEditingCartItem = false`（进行中的新配置）→ 收敛到当前唯一可售类型，
 *    避免一个发售期已下架的类型从旧状态里漏进新订单。
 */
export const reconcileLaunchLensType = (
  type: PrescriptionType | null,
  isEditingCartItem: boolean,
): PrescriptionType | null =>
  !isEditingCartItem && type && !isLensTypeAvailable(type) ? soleLensType() : type;

/* ---- 镀膜 / 升级项的客户可见性 ---- */

/**
 * 不对客户展示的镀膜项 id。
 *
 * 这里隐藏的只是**展示**，不是能力：防刮(sc) 是 $0 的标配属性（group:'included'，
 * 客户本来也不能勾选），镜片实际仍然是双面加硬镀膜。因此：
 *  - TREATMENTS 里的数据、名称、三语文案、价格全部保留；
 *  - includedTreatmentIds 仍会把它写进订单的 treatmentIds（生产端需要这条记录）；
 *  - 只是在镀膜页、评审页、结算页、订单详情这些客户可见的清单里不再列出。
 * 日后要恢复展示，把它从这个数组里去掉即可。
 */
export const HIDDEN_TREATMENT_IDS: string[] = ['sc'];

/** 该镀膜项当前是否对客户展示。 */
export const isTreatmentVisible = (id: string): boolean => !HIDDEN_TREATMENT_IDS.includes(id);
