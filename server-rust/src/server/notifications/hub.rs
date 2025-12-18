use once_cell::sync::OnceCell;
use tokio::sync::broadcast;

static SENDER: OnceCell<broadcast::Sender<String>> = OnceCell::new();

pub fn get_sender() -> broadcast::Sender<String> {
    SENDER.get_or_init(|| {
        let (s, _r) = broadcast::channel(1024);
        s
    }).clone()
}

pub fn subscribe() -> broadcast::Receiver<String> {
    get_sender().subscribe()
}
