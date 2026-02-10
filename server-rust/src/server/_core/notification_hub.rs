use once_cell::sync::OnceCell;
use tokio::sync::broadcast;

pub struct NotificationHub {}

static CORE_SENDER: OnceCell<broadcast::Sender<String>> = OnceCell::new();

impl NotificationHub {
    pub fn get_sender() -> broadcast::Sender<String> {
        CORE_SENDER.get_or_init(|| {
            let (s, _r) = broadcast::channel(1024);
            s
        }).clone()
    }

    pub fn subscribe() -> broadcast::Receiver<String> {
        Self::get_sender().subscribe()
    }

    pub fn publish(_user_id: i64, msg: &str) {
        let _ = Self::get_sender().send(msg.to_string());
    }
}
