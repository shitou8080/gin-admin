import { getLevelCode, getMenuKeys } from '../utils/utils';
import config from '../config';
import * as loginService from '../services/login';

export default {
  namespace: 'global',

  state: {
    title: config.title || '',
    copyRight: config.copyRight,
    defaultURL: config.defaultURL,
    collapsed: false,
    openKeys: [],
    selectedKeys: [],
    user: { user_name: 'admin', real_name: '管理员' },
    menuPaths: {
      '/system/menu': { level_code: '01' },
      '/system/role': { level_code: '02' },
      '/system/user': { level_code: '03' },
    },
    menus: [
      {
        icon: 'solution',
        level_code: '01',
        name: '菜单管理',
        router: '/system/menu',
      },
      {
        icon: 'audit',
        level_code: '02',
        name: '角色管理',
        router: '/system/role',
      },
      {
        icon: 'user',
        level_code: '03',
        name: '用户管理',
        router: '/system/user',
      },
    ],
  },

  effects: {
    *menuEvent({ payload }, { put, select }) {
      let pathname = payload;
      if (pathname === '/') {
        pathname = yield select(state => state.global.defaultURL);
      }

      const menuPaths = yield select(state => state.global.menuPaths);
      const menus = yield select(state => state.global.menus);
      const keys = getMenuKeys(pathname, menuPaths, menus);

      if (keys.length > 0) {
        yield put({
          type: 'changeOpenKeys',
          payload: keys.slice(0, keys.length - 1),
        });
      }

      const levelCode = getLevelCode(pathname, menuPaths);
      yield put({
        type: 'changeSelectedKeys',
        payload: [levelCode],
      });
    },
    *fetchUser(_, { call, put }) {
      const response = yield call(loginService.getCurrentUser);
      yield put({
        type: 'saveUser',
        payload: response,
      });
    },
    *fetchMenus({ payload }, { call, put }) {
      const response = yield call(loginService.queryCurrentMenus);
      yield put({
        type: 'saveMenus',
        payload: response,
      });

      const menuPaths = {};
      function findPath(data) {
        for (let i = 0; i < data.length; i += 1) {
          if (data[i].router !== '') {
            menuPaths[data[i].router] = data[i];
          }
          if (data[i].children && data[i].children.length > 0) {
            findPath(data[i].children);
          }
        }
      }
      findPath(response);

      yield put({
        type: 'saveMenuPaths',
        payload: menuPaths,
      });

      yield put({
        type: 'menuEvent',
        payload,
      });
    },
  },

  reducers: {
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
      };
    },
    changeOpenKeys(state, { payload }) {
      return {
        ...state,
        openKeys: payload,
      };
    },
    changeSelectedKeys(state, { payload }) {
      return {
        ...state,
        selectedKeys: payload,
      };
    },
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen(({ pathname }) => {
        dispatch({
          type: 'menuEvent',
          payload: pathname,
        });
      });
    },
  },
};
