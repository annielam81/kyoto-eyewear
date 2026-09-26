/**
 * Admin 路由表。
 *
 * 说明：路由只负责"地址 → 视图文件"的映射。以下视图由其他专员负责，
 * 文件尚不存在时会自动渲染 _UnderConstruction.vue 占位，文件一旦
 * 提交即被自动加载，无需改路由：
 *   BatchUpload.vue / Import.vue / Review.vue / AIStudio.vue /
 *   Orders.vue / Prescriptions.vue / Customers.vue / Promotions.vue
 *
 * 约定（给视图专员）：
 *  - /products/new 与 /products/:id 共用 ProductEditor.vue，
 *    用 route.params.id 区分（'new' 表示新建）。
 *  - /upload?mode=camera 表示从手机拍照入口进入。
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useSessionStore } from './stores/session';

const viewModules = import.meta.glob('./views/*.vue');

function loadView(file: string) {
  const loader = viewModules[`./views/${file}`] as (() => Promise<unknown>) | undefined;
  if (loader) return loader;
  // 对应视图文件还未创建：显示"建设中"占位
  return () => import('./views/_UnderConstruction.vue');
}

interface ViewDef {
  path: string;
  name: string;
  file: string;
  title: string;
  requiresPrescriptions?: boolean;
}

/** 需要 AppShell 布局的视图 */
const VIEW_DEFS: ViewDef[] = [
  { path: '', name: 'dashboard', file: 'Dashboard.vue', title: '仪表盘' },
  { path: 'products', name: 'products', file: 'Products.vue', title: '产品管理' },
  { path: 'products/new', name: 'product-new', file: 'ProductEditor.vue', title: '新增产品' },
  { path: 'products/:id', name: 'product-edit', file: 'ProductEditor.vue', title: '编辑产品' },
  { path: 'upload', name: 'upload', file: 'BatchUpload.vue', title: '批量上传' },
  { path: 'import', name: 'import', file: 'Import.vue', title: '供应商导入' },
  { path: 'review', name: 'review', file: 'Review.vue', title: '审核中心' },
  { path: 'ai-studio', name: 'ai-studio', file: 'AIStudio.vue', title: 'AI 工作室' },
  { path: 'inventory', name: 'inventory', file: 'Inventory.vue', title: '库存管理' },
  { path: 'orders', name: 'orders', file: 'Orders.vue', title: '订单管理' },
  { path: 'prescriptions', name: 'prescriptions', file: 'Prescriptions.vue', title: '处方管理', requiresPrescriptions: true },
  { path: 'customers', name: 'customers', file: 'Customers.vue', title: '顾客管理' },
  { path: 'promotions', name: 'promotions', file: 'Promotions.vue', title: '促销管理' },
  { path: 'settings', name: 'settings', file: 'Settings.vue', title: '设置' },
  { path: 'audit', name: 'audit', file: 'AuditLog.vue', title: '审计日志' },
];

const children: RouteRecordRaw[] = VIEW_DEFS.map(d => ({
  path: d.path,
  name: d.name,
  component: loadView(d.file),
  meta: { title: d.title, viewFile: d.file, requiresPrescriptions: !!d.requiresPrescriptions },
}));

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: loadView('Login.vue'),
    meta: { public: true, title: '登录', viewFile: 'Login.vue' },
  },
  {
    path: '/',
    component: loadView('AppShell.vue'),
    meta: { viewFile: 'AppShell.vue' },
    children,
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  if (!session.loaded) await session.init();

  if (to.meta.public) {
    if (session.isLoggedIn && to.name === 'login') return '/';
    return true;
  }
  if (!session.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresPrescriptions && !session.canAccessPrescriptions) {
    return '/';
  }
  return true;
});

export default router;
