import DefaultTheme from 'vitepress/theme'
import './custom.css'
import FlutterPhonePreview from './components/FlutterPhonePreview.vue'
import DartConsole from './components/DartConsole.vue'
import BiliVideoPlayer from './components/BiliVideoPlayer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FlutterPhonePreview', FlutterPhonePreview)
    app.component('DartConsole', DartConsole)
    app.component('BiliVideoPlayer', BiliVideoPlayer)
  }
}
