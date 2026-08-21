import type { Locale } from '@/models';
export interface UsState { code: string; name: Record<Locale, string> }
const S = (code: string, en: string, zh: string, es?: string): UsState =>
  ({ code, name: { 'en-US': en, 'zh-CN': zh, 'es-US': es ?? en } });
/** All 50 states + DC. Stored value is always the standardized code. */
export const US_STATES: UsState[] = [
  S('AL','Alabama','阿拉巴马'), S('AK','Alaska','阿拉斯加'), S('AZ','Arizona','亚利桑那'),
  S('AR','Arkansas','阿肯色'), S('CA','California','加利福尼亚'), S('CO','Colorado','科罗拉多'),
  S('CT','Connecticut','康涅狄格'), S('DE','Delaware','特拉华'), S('DC','District of Columbia','华盛顿特区','Distrito de Columbia'),
  S('FL','Florida','佛罗里达'), S('GA','Georgia','佐治亚'), S('HI','Hawaii','夏威夷','Hawái'),
  S('ID','Idaho','爱达荷'), S('IL','Illinois','伊利诺伊'), S('IN','Indiana','印第安纳'),
  S('IA','Iowa','艾奥瓦'), S('KS','Kansas','堪萨斯'), S('KY','Kentucky','肯塔基'),
  S('LA','Louisiana','路易斯安那','Luisiana'), S('ME','Maine','缅因'), S('MD','Maryland','马里兰'),
  S('MA','Massachusetts','马萨诸塞'), S('MI','Michigan','密歇根','Míchigan'), S('MN','Minnesota','明尼苏达'),
  S('MS','Mississippi','密西西比','Misisipi'), S('MO','Missouri','密苏里','Misuri'), S('MT','Montana','蒙大拿'),
  S('NE','Nebraska','内布拉斯加'), S('NV','Nevada','内华达'), S('NH','New Hampshire','新罕布什尔','Nuevo Hampshire'),
  S('NJ','New Jersey','新泽西','Nueva Jersey'), S('NM','New Mexico','新墨西哥','Nuevo México'),
  S('NY','New York','纽约','Nueva York'), S('NC','North Carolina','北卡罗来纳','Carolina del Norte'),
  S('ND','North Dakota','北达科他','Dakota del Norte'), S('OH','Ohio','俄亥俄'), S('OK','Oklahoma','俄克拉何马'),
  S('OR','Oregon','俄勒冈','Oregón'), S('PA','Pennsylvania','宾夕法尼亚','Pensilvania'),
  S('RI','Rhode Island','罗得岛'), S('SC','South Carolina','南卡罗来纳','Carolina del Sur'),
  S('SD','South Dakota','南达科他','Dakota del Sur'), S('TN','Tennessee','田纳西'), S('TX','Texas','得克萨斯'),
  S('UT','Utah','犹他'), S('VT','Vermont','佛蒙特'), S('VA','Virginia','弗吉尼亚'),
  S('WA','Washington','华盛顿'), S('WV','West Virginia','西弗吉尼亚','Virginia Occidental'),
  S('WI','Wisconsin','威斯康星'), S('WY','Wyoming','怀俄明'),
];
export const stateByCode = (c: string) => US_STATES.find(s => s.code === c);
