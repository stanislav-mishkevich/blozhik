use anyhow::Result;

pub fn send_email(to: &str, subject: &str, body: &str) -> Result<()> {
    // In production integrate with SMTP or external service. For now, log.
    println!("[email] to={} subject={} body={}", to, subject, body);
    Ok(())
}
// email.ts port stub removed — real implementation above
