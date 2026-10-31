import UIKit
import WebKit

/// Exposes the repository's bundled web game through a same-origin custom URL scheme.
/// This permits ES modules and relative assets to load from the app bundle.
final class GameBundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL
    init(root: URL) { self.root = root.standardizedFileURL; super.init() }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, url.host == "bundle" else {
            fail(urlSchemeTask, "Некорректный адрес ресурса"); return
        }
        let relative = url.path.isEmpty || url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(relative).standardizedFileURL
        guard file.path == root.path || file.path.hasPrefix(root.path + "/") else {
            fail(urlSchemeTask, "Недопустимый путь к ресурсу"); return
        }
        do {
            let data = try Data(contentsOf: file)
            let mime = Self.mime(file.pathExtension)
            let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count,
                                       textEncodingName: (mime.hasPrefix("text/") || mime.contains("javascript")) ? "utf-8" : nil)
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch { fail(urlSchemeTask, "Не удалось прочитать ресурс: \(relative)") }
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
    private func fail(_ task: WKURLSchemeTask, _ message: String) {
        task.didFailWithError(NSError(domain: "VoxelSurvival.Bundle", code: 404,
                                      userInfo: [NSLocalizedDescriptionKey: message]))
    }
    private static func mime(_ ext: String) -> String {
        switch ext.lowercased() {
        case "html","htm": return "text/html"
        case "css": return "text/css"
        case "js","mjs": return "text/javascript"
        case "json","webmanifest": return "application/json"
        case "png": return "image/png"
        case "jpg","jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "svg": return "image/svg+xml"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "ogg": return "audio/ogg"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ttf": return "font/ttf"
        default: return "application/octet-stream"
        }
    }
}

final class GameViewController: UIViewController, WKNavigationDelegate {
    private var webView: WKWebView!
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var prefersStatusBarHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }

    override func viewDidLoad() {
        super.viewDidLoad()
        let bg = UIColor(red: 7/255, green: 9/255, blue: 8/255, alpha: 1)
        view.backgroundColor = bg
        guard let root = Bundle.main.resourceURL else {
            showError("Не найдены ресурсы игры в приложении."); return
        }
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.setURLSchemeHandler(GameBundleSchemeHandler(root: root), forURLScheme: "app")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = bg
        webView.scrollView.backgroundColor = bg
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        webView.load(URLRequest(url: URL(string: "app://bundle/index.html")!))
    }
    private func showError(_ message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.numberOfLines = 0
        label.textAlignment = .center
        label.frame = view.bounds.insetBy(dx: 24, dy: 24)
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showError("Не удалось запустить игру: \(error.localizedDescription)")
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showError("Не удалось открыть игру: \(error.localizedDescription)")
    }
}
