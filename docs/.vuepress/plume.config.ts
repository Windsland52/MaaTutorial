/**
 * 主题配置（支持热更新）
 * 对此文件的修改不会重启 vuepress 服务
 * @see https://theme-plume.vuejs.press/config/basic/
 */

import { defineThemeConfig } from 'vuepress-theme-plume'

export default defineThemeConfig({
  // logo: '/logo.png',

  appearance: true,

  social: [
    { icon: 'github', link: 'https://github.com/MaaXYZ/MaaFramework' },
  ],
  navbarSocialInclude: ['github'],

  footer: false,

  locales: {
    '/zh_cn/': {
      navbar: [
        { text: '首页', link: '/zh_cn/' },
        { text: '课程', link: '/zh_cn/start/' },
      ],
      collections: [
        {
          type: 'doc',
          title: '课程',
          dir: 'start',
          linkPrefix: '/start/',
          sidebar: [
            'README.md',
          ],
        },
      ],
    },
  },
})
