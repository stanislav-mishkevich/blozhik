use anyhow::Result;
use std::path::{PathBuf};
use std::fs;

pub struct LocalStorage {
    pub base: PathBuf,
}

impl LocalStorage {
    pub fn new(base: PathBuf) -> Self { Self { base } }

    pub fn upload(&self, key: &str, data: &[u8]) -> Result<String> {
        let path = self.base.join(key);
        if let Some(parent) = path.parent() { fs::create_dir_all(parent)?; }
        fs::write(&path, data)?;
        Ok(path.to_string_lossy().to_string())
    }

    pub fn download(&self, key: &str) -> Result<Vec<u8>> {
        let path = self.base.join(key);
        let data = fs::read(path)?;
        Ok(data)
    }

    pub fn delete(&self, key: &str) -> Result<()> {
        let path = self.base.join(key);
        if path.exists() { fs::remove_file(path)?; }
        Ok(())
    }
}
// s3.ts port stub

pub fn create_signed_upload_url_for_key(key: &str) -> String {
    // Return a local scheme URL (no filesystem side-effects) for developer/testing usage.
    format!("local://{}", key)
}

pub fn create_signed_upload_url(content_type: &str) -> String {
    // generate a random key and return a local file URL where the frontend can PUT the file
    let uuid = uuid::Uuid::new_v4().to_string();
    let ext = match content_type.split('/').last() { Some(e) => e, None => "bin" };
    let key = format!("{}/{}.{}", "uploads", uuid, ext);
    create_signed_upload_url_for_key(&key)
}
