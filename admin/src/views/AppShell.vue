<template>
  <div class="shell">
    <!-- 桌面侧边栏 -->
    <aside class="sidebar">
      <div class="brand">
        <div class="name">KYOTO</div>
        <div class="sub">ADMIN CONSOLE</div>
      </div>
      <nav class="nav">
        <router-link v-for="n in navItems" :key="n.to" :to="n.to" :class="{ active: isActive(n.to) }">
          <span class="ico">{{ n.icon }}</span>{{ n.label }}
        </router-link>
      </nav>
      <div class="side-foot">
        <div>{{ session.profile?.displayName }} · {{ roleLabel }}</div>
        <div class="small" style="margin-top:4px">
          {{ session.providerName === 'mock' ? '本地 Mock' : 'Supabase' }}
        </div>
        <button class="btn btn-sm" style="margin-top:8px" @click="logout">退出登录</button>
      </div>
    </aside>

    <!-- 主区 -->
    <div class="main">
      <header class="topbar">
        <div class="brand-m">KYOTO</div>
        <div class="userchip">
          <span class="badge">{{ roleLabel }}</span>
          <span class="desktop-only">{{ session.profile?.email }}</span>
          <button class="btn btn-sm" @click="logout">退出</button>
        </div>
      </header>
      <router-view />
    </div>

    <!-- 手机底部导航 -->
    <nav class="bottomnav">
      <router-link v-for="n in bottomItems" :key="n.to" :to="n.to" :class="{ active: isActive(n.to) }">
        <span class="ico">{{ n.icon }}</span><span>{{ n.short }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();

interface NavItem { to: string; label: string; short: string; icon: string; needRx?: boolean }

const ALL_NAV: NavItem[] = [
  { to: '/', label: '仪表盘', short: '首页', icon: '◈' },
  { to: '/products', label: '产品管理', short: '产品', icon: '▦' },
  { to: '/upload', label: '批量上传', short: '上传', icon: '⇪' },
  { to: '/review', label: '审核中心', short: '审核', icon: '✓' },
  { to: '/inventory', label: '库存管理', short: '库存', icon: '▤' },
  { to: '/orders', label: '订单管理', short: '订单', icon: '🧾' },
  { to: '/prescriptions', label: '处方管理', short: '处方', icon: '✚', needRx: true },
  { to: '/customers', label: '顾客管理', short: '顾客', icon: '◉' },
  { to: '/promotions', label: '促销管理', short: '促销', icon: '✦' },
  { to: '/ai-studio', label: 'AI 工作室', short: 'AI', icon: '✧' },
  { to: '/import', label: '供应商导入', short: '导入', icon: '⇩' },
  { to: '/audit', label: '审计日志', short: '审计', icon: '≣' },
  { to: '/settings', label: '设置', short: '设置', icon: '⚙' },
];

const navItems = computed(() =>
  ALL_NAV.filter(n => !n.needRx || session.canAccessPrescriptions));

const bottomItems = computed(() =>
  navItems.value.filter(n => ['/', '/products', '/upload', '/inventory', '/orders'].includes(n.to)));

const roleLabel = computed(() => {
  const r = session.profile?.role;
  return r === 'owner' ? '店主' : r === 'admin' ? '管理员' : '店员';
});

function isActive(to: string) {
  if (to === '/') return route.path === '/';
  return route.path === to || route.path.startsWith(to + '/');
}

async function logout() {
  await session.signOut();
  await router.replace('/login');
}
</script>
