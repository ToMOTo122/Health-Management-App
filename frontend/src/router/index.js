import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/record',
    name: 'Record',
    component: () => import('../views/RecordView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import('../views/AnalysisView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken');
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const isGuest = to.matched.some((r) => r.meta.guest);

  if (requiresAuth && !token) {
    next('/login');
  } else if (isGuest && token) {
    next('/');
  } else {
    next();
  }
});

export default router;
