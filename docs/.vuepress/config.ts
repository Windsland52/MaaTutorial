/**
 * VuePress 站点配置
 * 对此文件的修改会重启 vuepress 服务
 * 主题相关配置请在 plume.config.ts 中修改（支持热更新）
 */

import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/MaaTutorial/',
  lang: 'zh-CN',
  title: 'Maa 教程',
  description: 'MaaFramework 自动化框架教程',

  locales: {
    '/zh_cn/': {
      lang: 'zh-CN',
      title: 'Maa 教程',
      description: 'MaaFramework 自动化框架教程',
    },
  },

  head: [],

  bundler: viteBundler(),
  shouldPrefetch: false,

  theme: plumeTheme({
    hostname: 'https://windsland52.github.io',

    /* 文档仓库配置，用于 editLink */
    docsRepo: 'Windsland52/MaaTutorial',
    docsDir: 'docs',
    docsBranch: 'master',

    editLink: true,

    /**
     * 编译缓存
     * @see https://theme-plume.vuejs.press/config/basic/#cache
     */
    cache: 'filesystem',

    autoFrontmatter: {
      permalink: false,
      createTime: false,
      title: false,
    },

    plugins: {
      /* 生成 llms.txt / llms-full.txt，便于 AI 读取全站内容 */
      llmstxt: {
        /* 内容都在 /zh_cn/ 下，默认只处理根语言会一页都抓不到 */
        locale: 'all',
      },
    },
  }),
})
