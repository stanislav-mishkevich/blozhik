use anyhow::Result;

pub fn call_llm(prompt: &str) -> Result<String> {
    // Stubbed LLM: echo the prompt with a prefix.
    Ok(format!("LLM_REPLY: {}", prompt))
}
// llm.ts port stub removed — real implementation above
