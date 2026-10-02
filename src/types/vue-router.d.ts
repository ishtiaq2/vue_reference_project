import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Used for the document title. Required on every route. */
    title: string
  }
}
