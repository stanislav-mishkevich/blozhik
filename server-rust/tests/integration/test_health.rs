use reqwest::StatusCode;

#[tokio::test]
async fn health_returns_ok() {
    // Запускаем локальный экземпляр сервера в фоне не реализовано в тесте;
    // Тест предполагает, что сервер запущен на 127.0.0.1:3000 при локальном запуске.
    let res = reqwest::get("http://127.0.0.1:3000/health").await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body: serde_json::Value = res.json().await.unwrap();
    assert_eq!(body["status"], "ok");
}
