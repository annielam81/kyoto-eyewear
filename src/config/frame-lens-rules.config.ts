/** Frame ↔ lens compatibility rules. Extend later for rimless/semi-rimless. */
export const LARGE_LENS_WIDTH = 52; // >= this favors thinner materials
export const SUN_PREFERS_IMPACT = true;

/* ---- 镜片类型 ↔ 处方规则 ---- */
import type { Prescription, PrescriptionType } from '@/models';

/** 硬性要求处方里有 ADD 的镜片类型：没有 ADD 就不能选。
 *  渐进(progressive)与双光(bifocal)都需要近用附加度数；单光(single)与老花(readers)不受此规则约束。
 *  这是全应用唯一的判定来源——界面不得另写一套。 */
export const TYPES_REQUIRING_ADD: PrescriptionType[] = ['progressive', 'bifocal'];

/** 处方里是否有可用的 ADD 近用附加度数。
 *  ADD 是正的加光度（手输选择器给的范围是 +0.75 ~ +3.00），所以要求能解析成 > 0 的数。
 *  两眼任一有值即算有——不额外发明「必须双眼都填」这类规则。 */
export const hasValidAdd = (p: Prescription | null | undefined): boolean => {
  if (!p) return false;
  return [p.od?.add, p.os?.add].some(v => {
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) && n > 0;
  });
};

/** 该镜片类型在当前处方下是否可选。 */
export const lensTypeAllowed = (type: PrescriptionType, p: Prescription | null | undefined): boolean =>
  !TYPES_REQUIRING_ADD.includes(type) || hasValidAdd(p);

/** 处方变化后收敛已选类型：ADD 不再可用时，清掉硬性要求 ADD 的类型，返回应保留的值。
 *  纯函数，便于测试；store 的 reconcileLensType() 只是把它套在自身状态上。 */
export const reconcileLensType = (
  type: PrescriptionType | null,
  p: Prescription | null | undefined,
): PrescriptionType | null => (type && !lensTypeAllowed(type, p) ? null : type);
