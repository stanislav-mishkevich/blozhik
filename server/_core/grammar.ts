import axios from 'axios';

export async function checkGrammar(text: string, language = 'en-US') {
  try {
    const res = await axios.post('https://api.languagetool.org/v2/check', new URLSearchParams({ text, language }));
    if (res.status === 200) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('[Grammar] LanguageTool check failed', err);
    return null;
  }
}
