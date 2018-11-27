import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { localRead } from '@/libs/util'
import customZhCn from './lang/zh-CN'
import customZhTw from './lang/zh-TW'
import customEnUs from './lang/en-US'
import zhCnLocale from 'iview/src/locale/lang/zh-CN'
import enUsLocale from 'iview/src/locale/lang/en-US'
import zhTwLocale from 'iview/src/locale/lang/zh-TW'

Vue.use(VueI18n)

// 自动根据浏览器系统语言设置语言
const navLang = navigator.language // navigator.language返回一个字符串,该字符串代表用户的首先语言，通常是浏览器使用的语言。navigator.language为只读属性。
const localLang = (navLang === 'zh-CN' || navLang === 'en-US') ? navLang : false
let lang = localLang || localRead('local') || 'zh-CN'

Vue.config.lang = lang // iview官网中的写法，vue-i18n只支持到5.0.3版本，高一个版本会报错（Vue.locale not a function）

// vue-i18n 6.x+写法 ; 更新vue-i18n到最新版本，修复iview不兼容最新版本的bug
Vue.locale = () => {}
const messages = {
  'zh-CN': Object.assign(zhCnLocale, customZhCn), // Object.assign() -> 浅拷贝、对象属性的合并;  ES6中，对象的属性和方法可简写：对象的属性值可不写，前提是属性名已经声明；
  'zh-TW': Object.assign(zhTwLocale, customZhTw), // var nObj = Object.assign({},obj,obj1);//花括号叫目标对象，后面的obj、obj1是源对象。对象合并是指：将源对象里面的属性添加到目标对象中去，若两者的属性名有冲突，后面的将会覆盖前面的
  'en-US': Object.assign(enUsLocale, customEnUs)
}
const i18n = new VueI18n({
  locale: lang,
  messages
})

export default i18n

// vue-i18n 5.x写法
// Vue.locale('zh-CN', Object.assign(zhCnLocale, customZhCn))
// Vue.locale('en-US', Object.assign(zhTwLocale, customZhTw))
// Vue.locale('zh-TW', Object.assign(enUsLocale, customEnUs))
