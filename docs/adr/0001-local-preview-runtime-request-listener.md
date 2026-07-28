# 本地预览运行层使用单一 Node 请求处理器

本项目决定把访客互动、站主操作、研究投影及其安全门禁封装在一个深模块中，由 `createLocalPreviewRuntime(...)` 返回完整的 Node HTTP 请求处理器，并在模块内部组合 Next.js fallback。这样调用方无法遗漏安全响应头、路由顺序或错误兜底；代价是该运行层明确绑定 Node HTTP，不提前为尚不存在的 Edge Runtime 需求建立抽象。
