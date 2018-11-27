import Cookies from 'js-cookie' // npm 为我们封装好的插件 js-cookie ；
// cookie保存的天数
import config from '@/config'
import { forEach, hasOneOf, objEqual } from '@/libs/tools' // 使用 export{接口} 导出接口， 大括号中的接口名字为上面定义的变量， import 和 export 是对应的 ;  https://www.jb51.net/article/136942.htm

export const TOKEN_KEY = 'token'

export const setToken = (token) => { // 设置cookie ； Cookies.set('name', 'value', { expires: 7, path: '' }) 7天过期 ;  Cookies.set('name', { foo: 'bar' }) 设置一个json;
  Cookies.set(TOKEN_KEY, token, { expires: config.cookieExpires || 1 })
}

export const getToken = () => { // Cookies.get('name') 获取cookie ; Cookies.get() 读取所有的cookie;
  const token = Cookies.get(TOKEN_KEY)
  if (token) return token
  else return false
}

export const hasChild = (item) => { // hasChild() 有没有子节点
  return item.children && item.children.length !== 0
}

const showThisMenuEle = (item, access) => { // 菜单根据权限从路由获取 ， 无权限的菜单不显示
  if (item.meta && item.meta.access && item.meta.access.length) {
    if (hasOneOf(item.meta.access, access)) return true
    else return false
  } else return true
}
/**
 * @param {Array} list 通过路由列表得到菜单列表
 * @returns {Array}
 */
export const getMenuByRouter = (list, access) => {
  let res = []
  forEach(list, item => { // foreach循环用于列举出集合中所有的元素，foreach语句中的表达式由关键字in隔开的两个项组成。in右边的项是集合名，in左边的项是变量名，用来存放该集合中的每个元素。; forEach() 方法用于调用数组的每个元素，并将元素传递给回调函数
    if (!item.meta || (item.meta && !item.meta.hideInMenu)) {
      let obj = {
        icon: (item.meta && item.meta.icon) || '',
        name: item.name,
        meta: item.meta
      }
      if ((hasChild(item) || (item.meta && item.meta.showAlways)) && showThisMenuEle(item, access)) {
        obj.children = getMenuByRouter(item.children, access)
      }
      if (item.meta && item.meta.href) obj.href = item.meta.href
      if (showThisMenuEle(item, access)) res.push(obj)
    }
  })
  return res
}

/**
 * @param {Array} routeMetched 当前路由metched
 * @returns {Array}
 */
export const getBreadCrumbList = (route, homeRoute) => { // 动态 title 在路由里配置 ， meta.title 改成一个回调函数，参数是当前路由，返回一个在面包屑和标签栏显示的字符串
  let homeItem = { ...homeRoute, icon: homeRoute.meta.icon } // 扩展运算符用三个点号表示 ， 功能是把数组或类数组对象展开成一系列用逗号隔开的值 ;  rest运算符也是三个点号，不过其功能与扩展运算符恰好相反，把逗号隔开的值序列组合成一个数组 var [a, ...rest] = [1, 2, 3, 4];
  let routeMetched = route.matched // vue 动态路由多级嵌套面包屑怎么弄, https://segmentfault.com/a/1190000010574901
  if (routeMetched.some(item => item.name === homeRoute.name)) return [homeItem] // 面包屑导航home页也可现实图标 ; some() 方法用于检测数组中的元素是否满足指定条件（函数提供）, some() 方法会依次执行数组的每个元素, 如果有一个元素满足条件，则表达式返回true , 剩余的元素不会再执行检测; 如果没有满足条件的元素，则返回false。
  let res = routeMetched.filter(item => { // filter() 方法创建一个新的数组，新数组中的元素是通过检查指定数组中符合条件的所有元素;  filter() 不会对空数组进行检测;  filter() 不会改变原始数组
    return item.meta === undefined || !item.meta.hideInBread
  }).map(item => { // map() 方法返回一个新数组，数组中的元素为原始数组元素调用函数处理后的值 ; map() 方法按照原始数组元素顺序依次处理元素 ; map() 不会对空数组进行检测 ; map() 不会改变原始数组
    let meta = { ...item.meta }
    if (meta.title && typeof meta.title === 'function') meta.title = meta.title(route)
    let obj = {
      icon: (item.meta && item.meta.icon) || '',
      name: item.name,
      meta: meta
    }
    return obj
  })
  res = res.filter(item => {
    return !item.meta.hideInMenu
  })
  return [{ ...homeItem, to: homeRoute.path }, ...res]
}

export const getRouteTitleHandled = (route) => {
  let router = { ...route }
  let meta = { ...route.meta }
  let title = ''
  if (meta.title) {
    if (typeof meta.title === 'function') title = meta.title(router)
    else title = meta.title
  }
  meta.title = title
  router.meta = meta
  return router
}

export const showTitle = (item, vm) => {
  let title = item.meta.title
  if (!title) return
  if (vm.$config.useI18n) {
    if (title.includes('{{') && title.includes('}}') && vm.$config.useI18n) title = title.replace(/({{[\s\S]+?}})/, (m, str) => str.replace(/{{([\s\S]*)}}/, (m, _) => vm.$t(_.trim())))
    else title = vm.$t(item.name)
  } else title = (item.meta && item.meta.title) || item.name
  return title
}

/**
 * @description 本地存储和获取标签导航列表
 */
export const setTagNavListInLocalstorage = list => {
  localStorage.tagNaveList = JSON.stringify(list) // localstorage可以说是对cookie的优化，使用它可以方便在客户端存储数据，并且不会随着HTTP传输
}
/**
 * @returns {Array} 其中的每个元素只包含路由原信息中的name, path, meta三项
 */
export const getTagNavListFromLocalstorage = () => {
  const list = localStorage.tagNaveList
  return list ? JSON.parse(list) : []
}

/**
 * @param {Array} routers 路由列表数组
 * @description 用于找到路由列表中name为home的对象
 */
export const getHomeRoute = (routers, homeName = 'home') => {
  let i = -1
  let len = routers.length
  let homeRoute = {}
  while (++i < len) {
    let item = routers[i]
    if (item.children && item.children.length) {
      let res = getHomeRoute(item.children, homeName)
      if (res.name) return res
    } else {
      if (item.name === homeName) homeRoute = item
    }
  }
  return homeRoute
}

/**
 * @param {*} list 现有标签导航列表
 * @param {*} newRoute 新添加的路由原信息对象
 * @description 如果该newRoute已经存在则不再添加
 */
export const getNewTagList = (list, newRoute) => {
  const { name, path, meta } = newRoute
  let newList = [...list]
  if (newList.findIndex(item => item.name === name) >= 0) return newList
  else newList.push({ name, path, meta })
  return newList
}

/**
 * @param {*} access 用户权限数组，如 ['super_admin', 'admin']
 * @param {*} route 路由列表
 */
const hasAccess = (access, route) => {
  if (route.meta && route.meta.access) return hasOneOf(access, route.meta.access)
  else return true
}

/**
 * 权鉴
 * @param {*} name 即将跳转的路由name
 * @param {*} access 用户权限数组
 * @param {*} routes 路由列表
 * @description 用户是否可跳转到该页
 */
export const canTurnTo = (name, access, routes) => {
  const routePermissionJudge = (list) => {
    return list.some(item => {
      if (item.children && item.children.length) {
        return routePermissionJudge(item.children)
      } else if (item.name === name) {
        return hasAccess(access, item)
      }
    })
  }

  return routePermissionJudge(routes)
}

/**
 * @param {String} url
 * @description 从URL中解析参数
 */
export const getParams = url => {
  const keyValueArr = url.split('?')[1].split('&')
  let paramObj = {}
  keyValueArr.forEach(item => {
    const keyValue = item.split('=')
    paramObj[keyValue[0]] = keyValue[1]
  })
  return paramObj
}

/**
 * @param {Array} list 标签列表
 * @param {String} name 当前关闭的标签的name
 */
export const getNextRoute = (list, route) => {
  let res = {}
  if (list.length === 2) {
    res = getHomeRoute(list)
  } else {
    const index = list.findIndex(item => routeEqual(item, route)) // findIndex() 函数也是查找目标元素，找到就返回元素的位置，找不到就返回-1。
    if (index === list.length - 1) res = list[list.length - 2]
    else res = list[index + 1]
  }
  return res
}

/**
 * @param {Number} times 回调函数需要执行的次数
 * @param {Function} callback 回调函数
 */
export const doCustomTimes = (times, callback) => {
  let i = -1
  while (++i < times) {
    callback(i)
  }
}

/**
 * @param {Object} file 从上传组件得到的文件对象
 * @returns {Promise} resolve参数是解析后的二维数组
 * @description 从Csv文件中解析出表格，解析成二维数组
 */
export const getArrayFromFile = (file) => {
  let nameSplit = file.name.split('.')
  let format = nameSplit[nameSplit.length - 1]
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsText(file) // 以文本格式读取
    let arr = []
    reader.onload = function (evt) {
      let data = evt.target.result // 读到的数据
      let pasteData = data.trim()
      arr = pasteData.split((/[\n\u0085\u2028\u2029]|\r\n?/g)).map(row => {
        return row.split('\t')
      }).map(item => {
        return item[0].split(',')
      })
      if (format === 'csv') resolve(arr)
      else reject(new Error('[Format Error]:你上传的不是Csv文件'))
    }
  })
}

/**
 * @param {Array} array 表格数据二维数组
 * @returns {Object} { columns, tableData }
 * @description 从二维数组中获取表头和表格数据，将第一行作为表头，用于在iView的表格中展示数据
 */
export const getTableDataFromArray = (array) => {
  let columns = []
  let tableData = []
  if (array.length > 1) {
    let titles = array.shift() // push()、pop()和unshift()、shift() 这两组同为对数组的操作，并且会改变数组的本身的长度及内容  ；  不同的是 push()、pop() 是从数组的尾部进行增减，unshift()、shift() 是从数组的头部进行增减。
    columns = titles.map(item => {
      return {
        title: item,
        key: item
      }
    })
    tableData = array.map(item => {
      let res = {}
      item.forEach((col, i) => {
        res[titles[i]] = col
      })
      return res
    })
  }
  return {
    columns,
    tableData
  }
}

export const findNodeUpper = (ele, tag) => {
  if (ele.parentNode) { // parentNode 属性可返回某节点的父节点
    if (ele.parentNode.tagName === tag.toUpperCase()) { // tagName 属性返回元素的标签名  ；  toUpperCase() 方法用于把字符串转换为大写《一个新的字符串，在其中 stringObject 的所有小写字符全部被转换为了大写字符。》。
      return ele.parentNode
    } else {
      return findNodeUpper(ele.parentNode, tag)
    }
  }
}

export const findNodeUpperByClasses = (ele, classes) => {
  let parentNode = ele.parentNode
  if (parentNode) {
    let classList = parentNode.classList // classList 属性返回元素的类名， 作为 DOMTokenList 对象  ； 该属性用于在元素中添加，移除及切换 CSS 类  ； classList 属性是只读的，但你可以使用 add() 和 remove() 方法修改它
    if (classList && classes.every(className => classList.contains(className))) { // every() 方法用于检测数组所有元素是否都符合指定条件（通过函数提供）// contains() 判断DOM元素的包含关系
      return parentNode
    } else {
      return findNodeUpperByClasses(parentNode, classes)
    }
  }
}

export const findNodeDownward = (ele, tag) => {
  const tagName = tag.toUpperCase()
  if (ele.childNodes.length) {
    let i = -1
    let len = ele.childNodes.length
    while (++i < len) {
      let child = ele.childNodes[i]
      if (child.tagName === tagName) return child
      else return findNodeDownward(child, tag)
    }
  }
}

export const showByAccess = (access, canViewAccess) => {
  return hasOneOf(canViewAccess, access)
}

/**
 * @description 根据name/params/query判断两个路由对象是否相等   ; 实现动态路由和带参路由的适配
 * @param {*} route1 路由对象
 * @param {*} route2 路由对象
 */
export const routeEqual = (route1, route2) => {
  const params1 = route1.params || {}
  const params2 = route2.params || {}
  const query1 = route1.query || {}
  const query2 = route2.query || {}
  return (route1.name === route2.name) && objEqual(params1, params2) && objEqual(query1, query2)
}

/**
 * 判断打开的标签列表里是否已存在这个新添加的路由对象
 */
export const routeHasExist = (tagNavList, routeItem) => {
  let len = tagNavList.length
  let res = false
  doCustomTimes(len, (index) => {
    if (routeEqual(tagNavList[index], routeItem)) res = true
  })
  return res
}

export const localSave = (key, value) => {
  localStorage.setItem(key, value) // 将变量存到 localStorage 里
}

export const localRead = (key) => {
  return localStorage.getItem(key) || '' // 读取保存在 localStorage 对象里名为name的变量的值
}
