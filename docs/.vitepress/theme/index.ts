import DefaultTheme from 'vitepress/theme'
import './custom.css'
import FlutterPhonePreview from './components/FlutterPhonePreview.vue'
import DartConsole from './components/DartConsole.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FlutterPhonePreview', FlutterPhonePreview)
    app.component('DartConsole', DartConsole)
  }
}
