/* 外观主题：宝塔（pagoda，默认）与日出（sunset）两套风格并存、可切换。
 * 切换只改变视觉层（主视觉图、展示字体、点缀色），商品 / 价格 / 试戴 / 配镜流程等
 * 功能层完全不受影响。选择持久化在本地（kyoto.theme），默认 pagoda。 */
export type ThemeName = 'pagoda' | 'sunset';

export const THEMES: { name: ThemeName }[] = [
  { name: 'pagoda' },
  { name: 'sunset' },
];

export const DEFAULT_THEME: ThemeName = 'pagoda';

export const THEME_STORAGE_KEY = 'kyoto.theme';
